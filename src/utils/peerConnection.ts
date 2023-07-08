class PeerConnection {
    pc: RTCPeerConnection | undefined;
    isMaster: boolean;
    state: string;
    timeout: number;
    dc: RTCDataChannel | null = null;
    onUpdateIce: Function;
    static server: Object;
    constructor(
        isMaster: boolean,
        { timeout, onUpdateIce } = { timeout: 3000, onUpdateIce: () => {} }
    ) {
        this.isMaster = isMaster;
        this.state = "pending";
        this.timeout = timeout;
        this.onUpdateIce = onUpdateIce;
        this.init();
    }

    init() {
        this.pc = new RTCPeerConnection();
        if (this.isMaster) this.dc = this.pc.createDataChannel("dc");
        this.state = "pending";
    }

    initListener() {
        this.pc!.onconnectionstatechange = () => {
            const state = this.pc!.connectionState;
            this.state = state;
            if (state === "disconnected" || state === "failed") {
            }
        };
    }

    async initOffer(): Promise<void> {
        if (this.state === "middle")
            throw Error("peer connection cannot be initialized twice!");
        if (this.isMaster === false)
            throw Error("cannot init offer from a slave!");
        try {
            const timeout = setTimeout(() => {
                console.log("create offer timeout, " + timeout + "ms");
                this.state = "pending";
                this.initOffer();

            }, this.timeout);
            const offer = await this.pc!.createOffer();
            this.pc!.setLocalDescription(offer);
            this.state
            this.pc!.onicecandidate = (e: RTCPeerConnectionIceEvent) => {
                if (e.candidate === null) {
                    console.log("offer created", this.pc!.localDescription);
                    clearTimeout(timeout);
                    this.state = "middle";
                    const sessionDescription = this.pc!.localDescription;

                    if (sessionDescription === null)
                        throw Error("failed to get generate answer!");
                    this.onUpdateIce(JSON.stringify(sessionDescription));
                }
            };
        } catch (err) {
            this.state = "pending";
            this.initOffer();
        }
    }

    connect(answerString: string) {
        if (this.isMaster === false)
            throw Error("cannot complete connection from slave side");

        const answer: RTCSessionDescription = JSON.parse(answerString);
        this.pc!.setRemoteDescription(answer);
    }

    async initAnswer(offer: string): Promise<string> {
        if (this.state === "middle")
            throw Error("peer connection cannot be initialized twice!");
        if (this.isMaster === true)
            throw Error("cannot init answer from a master!");
        try {
            const answer = await new Promise<RTCSessionDescription>(
                async (res, rej) => {
                    const timeout = setTimeout(() => {
                        rej("create answer timeout, " + timeout + "ms");
                    }, this.timeout);
                    this.pc!.setRemoteDescription(JSON.parse(offer));
                    const answer = await this.pc!.createAnswer();
                    this.pc!.setLocalDescription(answer);
                    this.pc!.onicecandidate = (
                        e: RTCPeerConnectionIceEvent
                    ) => {
                        if (e.candidate === null) {
                            console.log("offer set", this.pc!.localDescription);
                            clearTimeout(timeout);
                            this.state = "middle";
                            const sessionDescription =
                                this.pc!.localDescription;
                            if (sessionDescription === null)
                                throw Error("failed to get generate answer!");
                            res(sessionDescription);
                        }
                    };
                }
            );
            return JSON.stringify(answer);
        } catch (err) {
            return this.initAnswer(offer);
        }
    }
}
