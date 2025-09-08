import { useEffect, useRef } from "react";

export default function Receiver() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ownVideoRef = useRef<HTMLVideoElement>(null);

  const connection = useRef<WebSocket | null>(null);
  const receiver = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");
    const pc = new RTCPeerConnection();
    receiver.current = pc;

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0] || new MediaStream([event.track]);
      if (videoRef.current) {
        videoRef.current.srcObject = remoteStream;
      }
    };

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "receiver" }));
    };

    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case "createOffer": {
          await pc.setRemoteDescription(message.sdp);

          pc.onicecandidate = (event) => {
            if (event.candidate) {
              socket.send(
                JSON.stringify({
                  type: "iceCandidate",
                  candidate: event.candidate,
                })
              );
            }
          };

          const stream = await navigator.mediaDevices.getDisplayMedia({
            audio: true,
            video: true,
          });

          if (ownVideoRef.current) {
            ownVideoRef.current.srcObject = stream;
          }

          stream.getTracks().forEach((track) => pc.addTrack(track, stream));

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.send(
            JSON.stringify({ type: "createAnswer", sdp: pc.localDescription })
          );
          break;
        }
        case "iceCandidate":
          await pc.addIceCandidate(message.candidate);
          break;
        default:
          break;
      }
    };

    connection.current = socket;
    return () => socket.close();
  }, []);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 10,
      }}
    >
      <div style={{ border: "2px solid blue" }}>
        <h3>My Screen</h3>
        <video ref={ownVideoRef} autoPlay width={600} height={550} />
      </div>
      <div style={{ border: "2px solid red" }}>
        <h3>Contact Screen</h3>
        <video ref={videoRef} autoPlay width={600} height={550} />
      </div>
    </div>
  );
}
