import { useEffect, useRef } from "react";

export default function Sender() {
  const connection = useRef<WebSocket | null>(null);
  const sender = useRef<RTCPeerConnection | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const receiverVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");
    const pc = new RTCPeerConnection();
    sender.current = pc;

    pc.ontrack = (e) => {
      const [remoteStream] = e.streams;
      if (receiverVideoRef.current) {
        receiverVideoRef.current.srcObject = remoteStream;
      }
    };

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "sender" }));
    };
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case "createAnswer":
          pc.setRemoteDescription(message.sdp);
          pc.ontrack = (e) => {
            const [remoteStream] = e.streams;
            if (receiverVideoRef.current) {
              receiverVideoRef.current.srcObject = remoteStream;
            }
          };
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
      videoRef.current.srcObject = stream;
    }
    sender.current.addTrack(stream.getVideoTracks()[0], stream);

    const offer = await sender.current.createOffer();
    sender.current.setLocalDescription(offer);
    connection.current.send(
      JSON.stringify({ type: "createOffer", sdp: offer })
    );

    sender.current.onicecandidate = (e) => {
      connection.current!.send(
        JSON.stringify({ type: "iceCandidate", candidate: e.candidate })
      );
    };
  };

  return (
    <div>
      <button onClick={onSendOffer}>Sender</button>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}
      >
        <div style={{ border: "2px solid red" }}>
          <h3>My Screen</h3>
          <video ref={videoRef} autoPlay width={600} height={550} />
        </div>
        <div style={{ border: "2px solid blue" }}>
          <h3>Contact Screen</h3>
          <video ref={receiverVideoRef} autoPlay width={600} height={550} />
        </div>
      </div>
    </div>
  );
}
