export default function getOrigin(SD: Object | string) {
    if (typeof SD === "string") {
        SD = JSON.parse(SD);
    }
    const sdp: string = (SD as any)?.sdp;
    const origin = sdp
        ?.split("\r\n")?.find((item) => item.startsWith("o="))
        ?.split("o=")[1];
    return origin;
}
