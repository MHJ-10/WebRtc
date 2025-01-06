import  { useEffect } from 'react'

export default function Receiver() {
  // const videoRef = useRef<HTMLVideoElement>(null);
  // const [receiverSocket, setReceiverSocket] = useState<WebSocket|null>(null);
  useEffect(()=>{
    const socket = new WebSocket('ws://localhost:8080');
    socket.onopen=()=>{
      socket.send(JSON.stringify({type:"receiver"}));
    }

    socket.onmessage = async (event)=>{
      const message = JSON.parse(event.data);
  
      let pc =  new RTCPeerConnection();
      if(message.type==="createOffer"){
        pc.setRemoteDescription(message.sdp);
        pc.onicecandidate = (event)=>{
          if(event.candidate){
            socket?.send(JSON.stringify({type:'iceCandidate', candidate:event.candidate}));
          }
        }

        pc.ontrack=(event)=>{
          // console.log(event);
          const video = document.createElement('video');
          video.controls = true;
          document.body.appendChild(video);
          video.srcObject = new MediaStream([event.track]);
          setTimeout(()=>{
            video.play();
          },1000)
          // if(videoRef.current){
          //   videoRef.current.srcObject = new MediaStream([event.track]);
          // }
        }
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.send(JSON.stringify({type:"createAnswer", sdp:pc.localDescription}));

      }
      else if(message.type==='iceCandidate'){
        pc.addIceCandidate(message.iceCandidate);
      }
    }
  },[])
  return (
    <div>
      Receiver
    </div>
  )
}
