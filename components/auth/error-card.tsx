import { FaExclamationTriangle } from "react-icons/fa";
import { CardWrapper } from "./card-wrapper";

export const ErrorCard = () => {
  return (
    <CardWrapper
        headerLabel="Opps! something went wrong"
        backButtonLabel="Back to login"
        backButtonHref="/auth/login"
    >
        <div className="w-full flex justify-center text-destructive items-center">
            <FaExclamationTriangle />
        </div>
    </CardWrapper>
  );
};
