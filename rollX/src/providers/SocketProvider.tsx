"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";

type SocketContextType = {
  socket: Socket | null;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
});

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);

  useEffect(() => {
    // Only connect when fully authenticated
    if (status !== "authenticated" || !session?.user) return;
    if (socketRef.current) return;

    let isMounted = true;

    const connectGlobalSocket = async () => {
      try {
        // Fetch ticket once globally
        const res = await fetch("/api/ws/ticket", { method: "POST" });
        if (!res.ok) throw new Error("Failed to fetch global socket ticket");
        const { ticket } = await res.json();

        if (!isMounted) return;

        const socketUrl =
          process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080";
        const socket = io(socketUrl, {
          auth: { token: ticket },
          transports: ["websocket"],
          reconnectionAttempts: 10,
          reconnectionDelay: 2000,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
          console.log("✅ Global socket connected:", socket.id);
          setSocketInstance(socket); // Triggers re-render for children
        });

        socket.on("disconnect", () => {
          console.log("❌ Global socket disconnected");
          setSocketInstance(null);
        });
      } catch (error) {
        console.error("Global Socket Error:", error);
      }
    };

    connectGlobalSocket();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocketInstance(null);
      }
    };
  }, [session, status]);

  return (
    <SocketContext.Provider value={{ socket: socketInstance }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useGlobalSocket = () => useContext(SocketContext);
