import PromptSuggestionButton from "./PromptSuggestionButton"

const PromptSuggestionsRow = ({
    onPromptClick,
}: {
    onPromptClick: (prompt: string) => void;
}) => {
    const prompts = [
        "Who is head of racing for Aston Martin's F1 Academy",
        "Who is the highest paid F1 driver",
        "Who will be the newest driver for Ferrari",
        "What is the fastest lap time in F1 history",
    ]


    return (
       <div className="flex flex-row flex-wrap items-center justify-center mt-4">
            {prompts.map((prompt, index) => (
                <PromptSuggestionButton
                    key={`suggestion-${index}`}
                    onClick={() => onPromptClick(prompt)}
                    text={prompt}
                />
            ))}
            </div>
    );
}

export default PromptSuggestionsRow;