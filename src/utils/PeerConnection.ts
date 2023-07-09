export class PeerConnection {
    private pc: RTCPeerConnection | undefined;
    readonly isMaster: boolean;
    private _state: string;
    readonly timeout: number;
    dc: RTCDataChannel | null = null;
    readonly onUpdateLD: Function;
    readonly maxRetry: number;
    private retry = 0;
    readonly owner: number;
    readonly target: number;
    static server: Object;
    constructor(
        owner: number,
        target: number,
        { timeout = 3000, onUpdateLD = () => {}, maxRetry = 3 }={}
    ) {
        this.owner = owner;
        this.target = target;
        this.isMaster = owner > target;
        this._state = "pending";
        this.timeout = timeout;
        this.onUpdateLD = onUpdateLD;
        this.maxRetry = maxRetry;
        this.init();
    }
    get state() {
        return this._state;
    }

    get LD(){
      return this.pc?.localDescription
    }

    getLabel() {
        return `from ${this.isMaster ? "master" : "slave"}: ${this.owner} to ${
            this.isMaster ? "slave" : "master"
        }: ${this.target}, `;
    }

    pcError(err: string) {
        return Error(this.getLabel() + err);
    }

    async init(offer?: string) {
        try {
            this.retry++;
            if (!!PeerConnection.server)
                throw this.pcError("server hasn't been setup!");
            this.pc = new RTCPeerConnection(PeerConnection.server);
            this.pc.onconnectionstatechange = () => {
                const state = this.pc!.connectionState;
                this._state = state;
                if (
                    state === "failed" ||
                    state === "closed" ||
                    state === "disconnected"
                ) {
                    throw this.pcError("failed to connect, retrying...");
                }
            };
            const timer = setTimeout(() => {
                throw this.pcError("timeout!" + this.timeout);
            }, this.timeout);
            if (this.isMaster) {
                this.dc = this.pc.createDataChannel("dc");
                this.dc.onmessage = (e) => {
                    //console.log(this.getLabel(), e.data);
                };
                this.dc.onopen = () => {
                    //console.log(this.getLabel(), "connection opened");
                };
                this.pc.onicecandidate = (e) => {
                    if (e.candidate === null) {
                        const LD = this.pc?.localDescription;
                        if (!!LD) {
                            throw this.pcError("failed to generate answer!");
                        } else {
                            this.onUpdateLD(JSON.stringify(LD));
                        }
                        clearTimeout(timer);
                    }
                };
                const offer = await this.pc.createOffer();
                this.pc.setLocalDescription(offer);
            } else {
                this.pc.ondatachannel = (e) => {
                    //console.log(this.getLabel(), "ondatachannel");
                    const dc = e.channel;
                    dc.onmessage = (e) => {
                        //console.log(this.getLabel(), e.data);
                    };
                    dc.onopen = () => {
                        //console.log(this.getLabel(), "connection opened");
                    };
                };
                if (!!!this.pc.remoteDescription) {
                    throw this.pcError("cannot double set remoteDesciption!");
                }
                await this.pc.setRemoteDescription(JSON.parse(offer!));
                this.pc.onicecandidate = (e) => {
                    if (e.candidate === null) {
                        const LD = this.pc?.localDescription;
                        if (!!LD) {
                            throw this.pcError("failed to generate answer!");
                        } else {
                            this.onUpdateLD(JSON.stringify(LD));
                        }
                        clearTimeout(timer);
                    }
                };
                const answer = await this.pc.createAnswer();
                this.pc.setLocalDescription(answer);
            }
        } catch (err) {
            if (this.retry > this.maxRetry)
                throw this.pcError("exceed max retry, please check network!");
            this.init(offer);
        }
    }

    connect(answerString: string) {
        try {
            if (this.isMaster === false)
                throw this.pcError(
                    "cannot complete connection from slave side"
                );

            const answer: RTCSessionDescription = JSON.parse(answerString);
            if (!!!this.pc?.remoteDescription)
                throw this.pcError("cannot double set remote answer!");
            this.pc!.setRemoteDescription(answer);
        } catch (err) {
            this.init();
        }
    }
}
