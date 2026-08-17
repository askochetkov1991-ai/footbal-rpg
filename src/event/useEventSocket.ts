import { useEffect, useRef } from "react";
import usePartySocket from "partysocket/react";
import { getPartyHost } from "./partyHost";
import { parseServerMessage, type ClientMessage, type ServerMessage } from "./protocol";

type Options = {
  code: string;
  hello: ClientMessage;
  onMessage: (message: ServerMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
};

export function useEventSocket({ code, hello, onMessage, onOpen, onClose }: Options) {
  const helloRef = useRef(hello);
  const onMessageRef = useRef(onMessage);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
  helloRef.current = hello;
  onMessageRef.current = onMessage;
  onOpenRef.current = onOpen;
  onCloseRef.current = onClose;

  const socket = usePartySocket({
    host: getPartyHost(),
    room: code,
    onOpen() {
      onOpenRef.current?.();
    },
    onMessage(event) {
      if (typeof event.data !== "string") return;
      const parsed = parseServerMessage(event.data);
      if (parsed) onMessageRef.current(parsed);
    },
    onClose() {
      onCloseRef.current?.();
    },
  });

  useEffect(() => {
    const sendHello = () => {
      socket.send(JSON.stringify(helloRef.current));
    };
    socket.addEventListener("open", sendHello);
    if (socket.readyState === WebSocket.OPEN) sendHello();
    return () => {
      socket.removeEventListener("open", sendHello);
    };
  }, [socket]);

  return {
    send(message: ClientMessage) {
      socket.send(JSON.stringify(message));
    },
  };
}
