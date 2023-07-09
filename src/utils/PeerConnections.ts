interface Room {
  id: string;
  roomName: string;
  owner?: string;
  users?: User[];
  history?: any[];
}

interface SessionDescription {
  id: string;

  sessionDescriptionString: string;

  target: User;

  owner: User;
}

interface User {
  id: string;
  username: string;
  ICE?: string;
  lastLogin?: Date;
  lastActive?: Date;
  online?: boolean;
  createdRooms?: Room[];
  room?: Room;
  ownerSessionDescription: SessionDescription[];
  targetSessionDescription: SessionDescription[];


  
}
class PeerConnections {
  users:any[] =[]
  connstructor(){

  }


  updateUsers(users: any[]){
    this.users = users;
    users.forEach(user)
  }

}