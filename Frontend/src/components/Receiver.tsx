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

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "receiver" }));
    };

    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case "createOffer": {
          pc.setRemoteDescription(message.sdp);
          pc.onicecandidate = (event) => {
            console.log(event.candidate);
            if (event.candidate) {
              socket?.send(
                JSON.stringify({
                  type: "iceCandidate",
                  candidate: event.candidate,
                })
              );
            }
          };
          const answer = await pc.createAnswer();
          pc.setLocalDescription(answer);
          socket.send(JSON.stringify({ type: "createAnswer", sdp: answer }));
          break;
        }
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

  // useEffect(() => {

  //   socket.onmessage = async (event) => {

  //     if (message.type === "createOffer") {
  //       pc.ontrack = (event) => {
  //         const stream = event.streams[0] || new MediaStream([event.track]);
  //         if (videoRef.current) {
  //           videoRef.current.srcObject = stream;
  //           videoRef.current.width = 300;
  //           videoRef.current.height = 150;
  //         }
  //       };

  //   };
  // }, []);

  return (
    <div>
      Receiver
      <button
        onClick={() => {
          console.log(receiver.current?.localDescription);
          console.log(receiver.current?.remoteDescription);
        }}
      >
        Get Status
      </button>
      <video ref={videoRef} autoPlay width={300} height={150} />
      <video ref={ownVideoRef} autoPlay width={300} height={150} />
    </div>
  );
}
