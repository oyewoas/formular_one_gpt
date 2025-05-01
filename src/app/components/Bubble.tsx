import { Message } from "ai";

const Bubble = ({ message }: { message: Message }) => {
    const { content, role } = message;

    const isUser = role === "user";

    return (
        <div
            className={`flex ${isUser ? "justify-end" : "justify-start"} m-4`}
        >
            <div
                className={`p-4 shadow-sm text-gray-800 max-w-sm ${
                    isUser
                        ? "bg-blue-200 rounded-[20px_20px_0_20px] ml-auto"
                        : "bg-gray-200 rounded-[20px_20px_20px_0]"
                }`}
            >
                <p>{content}</p>
            </div>
        </div>
    );
};

export default Bubble;