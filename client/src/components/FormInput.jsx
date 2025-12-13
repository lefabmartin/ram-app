import { Input } from "@chakra-ui/react";
import { forwardRef } from "react";

const FormInput = forwardRef(({ isInvalid, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      h="50px"
      px="16px"
      py="12px"
      fontSize="16px"
      borderRadius="8px"
      borderColor={isInvalid ? "#b40101" : "#aaa"}
      bg={isInvalid ? "#ffcbcb" : "white"}
      color={isInvalid ? "#b40101" : "#3f3f3f"}
      transition="all 0.3s ease"
      boxShadow={
        isInvalid ? "inset 0 1px 3px 0 #a50f0f" : "0 1px 3px rgba(0,0,0,0.1)"
      }
      _hover={{
        borderColor: isInvalid ? "#b40101" : "#279989",
        boxShadow: isInvalid
          ? "inset 0 1px 3px 0 #a50f0f"
          : "0 2px 6px rgba(39, 153, 137, 0.2)",
      }}
      _focus={{
        borderColor: isInvalid ? "#b40101" : "#279989",
        boxShadow: isInvalid
          ? "inset 0 1px 3px 0 #a50f0f, 0 0 0 1px #b40101"
          : "0 0 0 3px rgba(39, 153, 137, 0.15)",
        outline: "none",
      }}
      _placeholder={{
        color: isInvalid ? "#b40101" : "#999",
      }}
      {...props}
    />
  );
});

FormInput.displayName = "FormInput";

export default FormInput;
