import compareOrigin from "./compareOrigin";
import getOrigin from "./getOrigin";
import getRespondTo from "./getRespondTo";

export class PeerConnection {
    pc: RTCPeerConnection | null = null;

    dc: RTCDataChannel | null = null;
    timer: NodeJS.Timeout | null = null;
    owner: number;
    target: number;
    static server: Object;
    static emit: any = () => {};
    constructor(owner: number, target: number) {
        this.owner = owner;
        this.target = target;
    }

    get LD() {
        return this.pc?.localDescription;
    }

    get RD() {
        return this.pc?.remoteDescription;
    }

    get state() {
        return this.pc?.connectionState;
    }

    async gatherCandidate(isMaster: boolean = true) {
        return new Promise(async (res, rej) => {
            this.pc!.onicecandidate = (e: RTCPeerConnectionIceEvent) => {
                const candidate = e.candidate;
                if (candidate === null) {
                    res(this.pc?.localDescription);
                }
            };
            const offer = isMaster
                ? await this.pc!.createOffer()
                : await this.pc!.createAnswer();
            await this.pc!.setLocalDescription(offer);
        });
    }

    async initMaster() {
        try {
            this.clear();
            clearTimeout(this.timer!);
            this.timer = setTimeout(() => {
                if (this.state !== "connected") {
                    //this.initMaster();
                }
            }, 3000);
            this.pc = new RTCPeerConnection(PeerConnection.server);
            this.pc.onconnectionstatechange = () => {
                if (this.state === "disconnected" || this.state === "failed") {
                    this.initMaster();
                }
            };
            this.dc = this.pc.createDataChannel("dc");
            await this.gatherCandidate();
            //updateLD
            const message = {
                ownerId: this.owner,
                targetId: this.target,
                SD: JSON.stringify(this.LD),
                type: "offer",
            };
            console.log(PeerConnection.emit);
            PeerConnection.emit("sd", message);
        } catch (err) {
            console.log("failed to init master", err);
            //this.initMaster();
        }
    }

    clear() {
        clearTimeout(this.timer!);
        this.pc?.close();
        this.pc = null;
    }

    async initSlave(offerStr: string) {
        this.pc = new RTCPeerConnection(PeerConnection.server);
        const offer = JSON.parse(offerStr);
        await this.pc?.setRemoteDescription(offer);
        await this.gatherCandidate(false);
        const message = {
            ownerId: this.owner,
            targetId: this.target,
            SD: JSON.stringify(this.LD),
            type: "answer",
        };
        console.log("ready to emit")
        PeerConnection.emit("sd", message);

        //updateLD
    }

    async connect(answerStr: string) {
        const answer = JSON.parse(answerStr);
        await this.pc?.setRemoteDescription(answer);
    }
}
