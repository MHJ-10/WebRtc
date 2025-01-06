import {useEffect, useState } from 'react'

export default function Sender() {
  const [senderSocket, setSenderSocket] = useState<WebSocket|null>(null);
    useEffect(()=>{
        const socket = new WebSocket('ws://localhost:8080');
        socket.onopen=()=>{
            socket.send(JSON.stringify({type:"sender"}))
        }
        setSenderSocket(socket);
    },[])

    async function startSendingVideo(){
      if(!senderSocket) return;
      const pc = new RTCPeerConnection();
      pc.onnegotiationneeded = async () =>{
        console.log("negotiated");
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        senderSocket?.send(JSON.stringify({type:'createOffer', sdp:pc.localDescription}));
      }
     
      pc.onicecandidate = (event)=>{
        if(event.candidate){
          senderSocket?.send(JSON.stringify({type:'iceCandidate', candidate:event.candidate}));
        }
      }

      senderSocket.onmessage=(event)=>{
        const message = JSON.parse(event.data);

        if(message.type==='createAnswer'){
          pc.setRemoteDescription(message.data);
        }
        else if(message.type==="iceCandidate"){
          pc.addIceCandidate(message.candidate);
        }
      }
      const vdoStream = await navigator.mediaDevices.getUserMedia({video:true, audio:false});
      pc.addTrack(vdoStream.getVideoTracks()[0]);
    }
  return (
    <div>
      <button onClick={startSendingVideo}>Sender</button>
    </div>
  )
}
