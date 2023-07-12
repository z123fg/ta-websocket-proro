export default function getRespondTo(SD: string | Object) {
    if (typeof SD === "string") {
        SD = JSON.parse(SD);
    }

    const respondTo = (SD as any).respondTo;
    return respondTo;
}
