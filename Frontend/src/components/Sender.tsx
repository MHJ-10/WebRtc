import { useEffect, useRef } from "react";

export default function Sender() {
  const connection = useRef<WebSocket | null>(null);
  const sender = useRef<RTCPeerConnection | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");
    const pc = new RTCPeerConnection();
    sender.current = pc;

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "sender" }));
    };

    pc.ontrack = (e) => {
      console.log(e);
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case "createAnswer":
          pc.setRemoteDescription(message.sdp);
          break;
        case "iceCandidate":
          pc.addIceCandidate(message.candidate);
          break;
        default:
          break;
      }
    };

    connection.current = socket;

    return () => socket.close();
  }, []);

  const onSendOffer = async () => {
    if (!connection.current || !sender.current) return;

    const stream = await navigator.mediaDevices.getDisplayMedia({
      audio: true,
      video: true,
    });

    if (videoRef.current) {
      videoRef.current.width = 300;
      videoRef.current.height = 150;
      videoRef.current.srcObject = stream;
    }
    sender.current.addTrack(stream.getVideoTracks()[0]);

    const offer = await sender.current.createOffer();
    sender.current.setLocalDescription(offer);
    connection.current.send(
      JSON.stringify({ type: "createOffer", sdp: offer })
    );

    sender.current.onicecandidate = (e) => {
      console.log(e.candidate);
      connection.current!.send(
        JSON.stringify({ type: "iceCandidate", candidate: e.candidate })
      );
    };
  };

  return (
    <div>
      <button onClick={onSendOffer}>Sender</button>

      <button
        onClick={() => {
          console.log(sender.current?.localDescription);
          console.log(sender.current?.remoteDescription);
        }}
      >
        Get Status
      </button>

      <video ref={videoRef} autoPlay width={300} height={150} />
    </div>
  );
}
