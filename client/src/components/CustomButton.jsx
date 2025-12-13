import { Button, Spinner, Flex } from "@chakra-ui/react";

const CustomButton = ({ children, isLoading, ...props }) => {
  return (
    <Button
      w="full"
      maxW="180px"
      h="50px"
      fontSize="18px"
      fontWeight="700"
      bg={isLoading ? "#279989" : "#d3d3d3"}
      color={isLoading ? "white" : "#000"}
      borderRadius="25px"
      transition="all 0.3s ease"
      boxShadow={
        isLoading
          ? "0 4px 12px rgba(39, 153, 137, 0.4)"
          : "0 2px 8px rgba(0,0,0,0.15)"
      }
      isDisabled={isLoading}
      _hover={
        isLoading
          ? {}
          : {
              bg: "#279989",
              color: "white",
              transform: "translateY(-2px)",
              boxShadow: "0 4px 12px rgba(39, 153, 137, 0.4)",
            }
      }
      _active={{
        transform: "translateY(0)",
        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
      }}
      _disabled={{
        cursor: "not-allowed",
      }}
      {...props}>
      {isLoading ? (
        <Flex align="center" justify="center" gap={2}>
          <Spinner size="sm" color="white" thickness="3px" speed="0.65s" />
          {children}
        </Flex>
      ) : (
        children
      )}
    </Button>
  );
};

export default CustomButton;
