const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};


export const createPeerConnection = () => new RTCPeerConnection(servers);







// export const createPeerConnection = async (onMessageCb: Function) => {
//   const pc = new RTCPeerConnection(servers);
//   const dc = pc.createDataChannel('channel');

//   dc.onmessage = (e) => {
//     console.log('Received a message: ', e.data);
//     onMessageCb(e.data);
//   };

//   dc.onopen = (e) => {
//     console.log('Connection opened!');
//   };

//   // will be called when localdescription is set
//   pc.onicecandidate = (e) => {
//     console.log('New ICE candidate! Printing SDP...\n' + JSON.stringify(pc.localDescription));
//   };
//   const offer = await pc.createOffer();
//   pc.setLocalDescription(offer);
//   // TODO: send local description to server and get a room id
//   let roomId;
//   return [pc, dc, roomId];
// };

export const connectToRemote = (roomId: string) => {
  // TODO: get remote description from the server
  // pc.setRemoteDescription(JSON.parse(otherIDRef.current.value)).then(
  //   console.log("Answer received")
  // );
};

export const joinPeerConnection = (
  roomId: string,
  onMessageCb: Function,
): [RTCPeerConnection, RTCDataChannel | null] => {
  const pc = new RTCPeerConnection(servers);
  let dc: RTCDataChannel | null = null;

  // will be called when localdescription is set
  pc.onicecandidate = (e) => {
    console.log('New ICE candidate! Printing SDP...\n' + JSON.stringify(pc.localDescription));
  };

  pc.ondatachannel = (e) => {
    dc = e.channel;
    dc.onmessage = (e) => {
      console.log('Received a message: ', e.data);
      onMessageCb(e.data);
    };
    dc.onopen = () => {
      console.log('Connection opened!!!');
    };
  };

  // TODO: request remote description from server
  // pc.setRemoteDescription(JSON.parse(otherIDRef.current.value)).then(
  //   console.log("offer set!")
  // );

  pc.createAnswer()
    .then((answer) => {
      pc.setLocalDescription(answer);
    })
    .then(() => {
      console.log('Answer created. Set local description successfully!');
    });
  return [pc, dc];
};

export const send = (data: string, dc: RTCDataChannel) => {
  dc.send(data);
};
