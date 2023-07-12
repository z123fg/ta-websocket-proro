import compareOrigin from "./compareOrigin";
import getOrigin from "./getOrigin";
import getRespondTo from "./getRespondTo";

export class PeerConnection {
    private pc: RTCPeerConnection | undefined;
    readonly isMaster: boolean;
    readonly timeout: number;
    dc: RTCDataChannel | null = null;
    readonly onUpdateLD: (target: number, LD: string) => void;
    readonly maxRetry: number;
    private retry = 0;
    readonly owner: number;
    readonly target: number;
    static server: Object;
    private timer: NodeJS.Timeout | null = null;
    private connectBuffer: Function = () => {};

    constructor(
        owner: number,
        target: number,
        onUpdateLD = (target: number, LD: string) => {},
        { timeout = 20000, maxRetry = 15 } = {}
    ) {
        this.owner = owner;
        this.target = target;
        this.isMaster = owner > target;
        this.timeout = timeout;
        this.onUpdateLD = onUpdateLD;
        this.maxRetry = maxRetry;
    }
    get state() {
        return this.pc?.connectionState;
    }

    get LD() {
        return JSON.stringify(this.pc?.localDescription);
    }
    get RD() {
        return JSON.stringify(this.pc?.remoteDescription);
    }

    getLabel() {
        return `from ${this.isMaster ? "master" : "slave"}: ${this.owner} to ${
            this.isMaster ? "slave" : "master"
        }: ${this.target}, `;
    }

    pcError(err: string) {
        return Error(this.getLabel() + err);
    }

    async initMaster() {
        console.log("initMaster");
        if (this.state === "connected") {
            console.log("already connected!");
            return;
        }
        if (this.retry > this.maxRetry) throw this.pcError("exceed max retry, please check network!");
        this.retry++;
        if (!PeerConnection.server) throw this.pcError("server hasn't been setup!");
        this.clear();
        this.pc = new RTCPeerConnection(PeerConnection.server);
        try {
            this.timer = setTimeout(() => {
                console.error("timeout!" + this.timeout);
                this.initMaster();
            }, this.timeout);
            this.pc.onconnectionstatechange = () => {
                const state = this.pc!.connectionState;
                console.log("state!!!!!!!!!", state);
                if (state === "failed" || state === "disconnected") {
                    console.error("failed to connect, retrying...");
                    this.initMaster();
                } else if (state === "connected") {
                    this.retry = 0;
                    clearTimeout(this.timer!);
                    console.log("successfully connected!");
                } else if (state === "connecting" && this.pc?.signalingState!=="stable") {
                    console.log(this.pc, this.connectBuffer)
                    this.connectBuffer();
                    this.connectBuffer = () =>{}
                }
            };
            this.dc = this.pc.createDataChannel("dc");
            this.dc.onmessage = (e) => {
                //console.log(this.getLabel(), e.data);
            };
            this.dc.onopen = () => {
                console.log("open");
                //console.log(this.getLabel(), "connection opened");
            };
            this.pc.onicecandidate = (e) => {
                if (e.candidate === null) {
                    const LD = this.pc?.localDescription;
                    if (!!!LD) {
                        console.error("failed to generate answer!");
                        this.initMaster();
                    } else {
                        console.log("createdoffer", this.target);
                        this.onUpdateLD(this.target, JSON.stringify(LD));
                    }
                }
            };
            const offer = await this.pc.createOffer();
            this.pc.setLocalDescription(offer);
        } catch (err) {
            console.log("err", err);
            this.initMaster();
        }
    }

    async initSlave(offer: string) {
        console.log("initSlave", offer);
        if (compareOrigin(this.RD, offer)) {
            console.log("same RD, slave skipped");
            return;
        }
        if (this.state === "connected") {
            console.log("already connected!");
            return;
        }
        if (!PeerConnection.server) throw this.pcError("server hasn't been setup!");

        this.clear();
        this.pc = new RTCPeerConnection(PeerConnection.server);
        try {
            this.pc.onconnectionstatechange = () => {
                const state = this.pc!.connectionState;
                if (state === "failed" || state === "closed" || state === "disconnected") {
                    console.log("failed to connect, waiting for master..." + state);
                    this.clear();
                } else if (state === "connected") {
                    clearTimeout(this.timer!);
                    console.log("successfully connected!");
                    this.retry = 0;
                }
            };
            this.timer = setTimeout(() => {
                console.error("timeout!" + this.timeout + " ,waiting for master");
                this.clear();
            }, this.timeout);
            this.pc.ondatachannel = (e) => {
                //console.log(this.getLabel(), "ondatachannel");
                const dc = e.channel;
                dc.onmessage = (e) => {
                    //console.log(this.getLabel(), e.data);
                };
                dc.onopen = () => {
                    console.log("open");
                    //console.log(this.getLabel(), "connection opened");
                };
            };
            if (!!this.pc.remoteDescription) {
                //supposedly impossible
                console.error("cannot double set remoteDesciption! waiting for master...");
                return;
            }
            this.pc.onicecandidate = (e) => {
                if (e.candidate === null) {
                    const LD = this.pc?.localDescription;

                    if (!!!LD) {
                        console.error("failed to generate answer! waiting for master...");
                    } else {
                        clearTimeout(this.timer!);
                        const pendingLD = { type: LD.type, sdp: LD.sdp, respondTo: getOrigin(offer) };
                        console.log("createdAsnwer", this.target);
                        this.onUpdateLD(this.target, JSON.stringify(pendingLD));
                    }
                }
            };
            console.log("pending", this.state);
            await this.pc.setRemoteDescription(JSON.parse(offer));
            const answer = await this.pc.createAnswer();
            await this.pc.setLocalDescription(answer);
            console.log("setlocal!!!")
        } catch (err) {
            this.clear();
            console.error("unknown error: " + err + ", waiting for master...");
        }
    }
    clear() {
        console.log("clear1");
        this.pc?.close();
        clearTimeout(this.timer!);
        this.connectBuffer = () => {};
    }

    async connect(answerString: string) {
        if (this.isMaster === false) {
            console.error("cannot set remote answer from slave side!");
            return;
        }
        if (compareOrigin(this.RD, answerString)) {
            console.log("same RD, skipping");
            return;
        }

        if (this.state === "connected") return;
        const respondTo = getRespondTo(answerString);
        const origin = getOrigin(this.LD);
        if (respondTo !== origin) {
            console.log("doesn't match the origin, skiping...", respondTo, origin);
            return;
        }
        try {
            console.log("connecting..", this.state);

            const answer: RTCSessionDescription = JSON.parse(answerString);
            if (!!this.pc?.remoteDescription) {
                console.log("connectremote", JSON.stringify(this.pc.remoteDescription), answerString);
                console.error("cannot double set remote answer");
                return;
            }
            console.log("actually set remote", JSON.stringify(this.pc?.currentLocalDescription), this.state);
            //await this.pc!.setRemoteDescription(answer);
            if (this.state === "new") {
                this.connectBuffer = () => {
                    this.pc!.setRemoteDescription(answer);
                };
            }
            await this.pc!.setRemoteDescription(answer);
        } catch (err) {
            // console.error("failed to set answer, retrying..." + err);
            console.log("err1", err);
            this.retry = 0;
            this.initMaster();
        }
    }
}
