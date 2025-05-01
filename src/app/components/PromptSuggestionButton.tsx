const PromptSuggestionButton = ({
    onClick, text,
}: {
    onClick: () => void;
    text: string;
}) => {
    return (
        <button
            onClick={onClick}
            className="bg-white hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 border border-gray-300 rounded shadow-xs m-2 text-xs"
        >
            {text}
        </button>
    );
}

export default PromptSuggestionButton;