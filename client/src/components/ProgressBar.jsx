import { Box, Flex, Text } from "@chakra-ui/react";

const ProgressBar = ({ currentStep }) => {
  const steps = [
    { number: "01", title: "Your informations" },
    { number: "02", title: "Login" },
    { number: "03", title: "Payment details" },
    { number: "04", title: "Security check" },
    { number: "05", title: "Complete" },
  ];

  const progressWidths = ["10%", "30%", "50%", "75%", "100%"];

  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="#d3d3d3"
      px={{ base: 3, md: 4 }}
      pt={{ base: 2, md: 3 }}
      pb={{ base: 3, md: 4 }}
      mb={3}
      borderRadius="4px"
      boxShadow="0 1px 3px rgba(0,0,0,0.1)">
      <Box position="relative" py={1}>
        {/* Progress Bar Background */}
        <Box
          position="absolute"
          w="full"
          h="6px"
          top="20px"
          left="0"
          bg="#d3d3d3"
          borderRadius="3px"
          overflow="hidden">
          <Box
            h="full"
            w={progressWidths[currentStep - 1]}
            bg="#f7b512"
            transition="width 0.6s cubic-bezier(0.4, 0, 0.2, 1)"
            boxShadow="0 0 8px rgba(247, 181, 18, 0.5)"
          />
        </Box>

        {/* Steps */}
        <Flex justify="space-between" position="relative">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCurrent = stepNumber <= currentStep;

            return (
              <Box key={index} textAlign="center" flex="1" cursor="default">
                <Flex
                  w="40px"
                  h="40px"
                  bg={isCurrent ? "#f7b512" : "#d3d3d3"}
                  color={isCurrent ? "white" : "#8b8b8b"}
                  align="center"
                  justify="center"
                  borderRadius="50%"
                  fontWeight="bold"
                  fontSize="14px"
                  mx="auto"
                  mb={3}
                  transition="all 0.3s ease"
                  boxShadow={
                    isCurrent ? "0 3px 10px rgba(247, 181, 18, 0.4)" : "none"
                  }
                  border="3px solid"
                  borderColor={isCurrent ? "#f7b512" : "white"}
                  _hover={
                    isCurrent
                      ? {
                          transform: "scale(1.1)",
                          boxShadow: "0 4px 15px rgba(247, 181, 18, 0.6)",
                        }
                      : {}
                  }>
                  {step.number}
                </Flex>
                <Text
                  fontSize={{ base: "0.7em", md: "0.8em" }}
                  fontWeight={isCurrent ? "bold" : "normal"}
                  color={isCurrent ? "#3f3f3f" : "#8b8b8b"}
                  transition="all 0.3s"
                  px={1}>
                  {step.title}
                </Text>
              </Box>
            );
          })}
        </Flex>
      </Box>
    </Box>
  );
};

export default ProgressBar;
