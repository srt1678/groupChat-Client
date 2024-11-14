import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./chat.css";

const socket = io("http://localhost:3000"); // Connect to the server

function Chat() {
	const [name, setName] = useState("");
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [message, setMessage] = useState("");
	const [messages, setMessages] = useState([]);
	const [users, setUsers] = useState([]);
	const [currentChatRoom, setCurrentChatRoom] = useState("All");

	useEffect(() => {
		// Log connection status for debugging
		socket.on("connect", () => {
			console.log("Connected to server with socket ID:", socket.id);
		});

		// Listen for incoming messages
		socket.on("message", (msg) => {
			let msgObj = {
				content: msg.content,
				sender: msg.sender,
				room: msg.room,
				timestamp: new Date(),
			};
			setMessages((prev) => [...prev, msgObj]);
		});

		// Listen for updated user list
		socket.on("updateUsers", (userList) => {
			setUsers(userList);
		});

		// Listen for disconnections from the server
		socket.on("disconnect", (reason) => {
			console.log("Disconnected from server:", reason);
		});

		// Clean up when component unmounts or socket is disconnected
		return () => {
			// Only disconnect if needed, not automatically
			// socket.disconnect();
			socket.off("message");
			socket.off("updateUsers");
			socket.off("connect");
			socket.off("disconnect");
		};
	}, []);

	const handleLogin = () => {
		if (name.trim()) {
			socket.emit("join", name); // Emit join event to server with name
			setIsLoggedIn(true);
		}
	};

	const sendMessage = () => {
		if (message.trim()) {
			socket.emit("message", {
				content: message,
				sender: name,
				room: currentChatRoom,
			});
			setMessage("");
		}
	};

	const handlePrivateRoomSelect = (user) => {
		const roomName = [name, user].sort().join("-");
		setCurrentChatRoom(roomName);
	};

	const formatTimestamp = (timestamp) => {
		const hours = timestamp.getHours();
		const minutes = timestamp.getMinutes();
		const ampm = hours >= 12 ? "PM" : "AM";
		const formattedHours = hours % 12 || 12;
		const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
		return `${formattedHours}:${formattedMinutes} ${ampm}`;
	};

	return (
		<>
			{!isLoggedIn ? (
				<div className="enterNameDiv">
					<h2>Enter your name to join the chat</h2>
					<input
						className="enterNameInputBox"
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Your Name"
					/>
					<button className="joinButton" onClick={handleLogin}>
						Join
					</button>
				</div>
			) : (
				<div className="chatRoomOverallPage">
					<h2 className="title">CHAT ROOM</h2>
					<div className="chatRoomContainer">
						<div className="usersSection">
							<h3>Online Users</h3>
							<div
								className={
									currentChatRoom === "All"
										? "userContainerSelect"
										: "userContainer"
								}
								onClick={() => setCurrentChatRoom("All")}
							>
								All
							</div>
							{users.map(
								(user, index) =>
									user !== name && (
										<div
											key={user}
											className={
												currentChatRoom === `${[user, name].sort().join("-")}`
													? "userContainerSelect"
													: "userContainer"
											}
											onClick={() => {
												handlePrivateRoomSelect(user);
											}}
										>
											{user}
										</div>
									)
							)}
						</div>
						<div className="messagesSection">
							<div className="messageDisplay">
								{messages.map((msgObj, index) => {
									const { content, sender, room, timestamp } = msgObj;

									let participants;
									let standardizedRoom;
									if (room && room !== "All") {
										participants = room.split("-").sort();
										standardizedRoom = `${participants[0]}-${participants[1]}`;
									}

									if (
										room === currentChatRoom ||
										standardizedRoom === currentChatRoom
									) {
										return (
											<div
												key={index}
												className={
													sender === "System"
														? "systemMessage"
														: sender === name
														? "sentMessage"
														: "receivedMessage"
												}
											>
												{room === "All" &&
													sender !== "System" &&
													sender !== name && (
														<strong className="sender">{sender}: </strong>
													)}
												{content}
												<span className="timestamp">
													{formatTimestamp(timestamp)}
												</span>
											</div>
										);
									}
								})}
							</div>
							<div className="inputDisplay">
								<input
									type="text"
									value={message}
									onChange={(e) => setMessage(e.target.value)}
									placeholder="Type a message..."
									className="inputBox"
								/>
								<button className="sendButton" onClick={sendMessage}>
									Send
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
}

export default Chat;
