import { useEffect, useState } from "react";
import { Box, Container, Flex, Icon, Text, VStack } from "@chakra-ui/react";
import { MdLocationOn, MdCheck } from "react-icons/md";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProgressBar from "../components/ProgressBar";

const Complete = () => {
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsComplete(true);

      // Redirect after showing success
      setTimeout(() => {
        window.location.href = "https://ram.co.za";
      }, 2000);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Box minH="100vh" display="flex" flexDirection="column" bg="#efefef">
      <Header />

      <Box flex="1" py={{ base: 4, md: 6 }}>
        <Container maxW="800px" px={{ base: 4, md: 6 }} mx="auto">
          <ProgressBar currentStep={5} />

          <Box
            bg="white"
            border="1px solid"
            borderColor="#cbcbcb"
            borderRadius="8px"
            boxShadow="0 2px 12px rgba(0,0,0,0.08)"
            overflow="hidden">
            {/* Header Tab */}
            <Flex
              bg="#279989"
              bgGradient="linear(to-r, #279989, #2aaa96)"
              color="white"
              fontSize={{ base: "18px", md: "20px" }}
              fontWeight="700"
              p={4}
              align="center"
              justify="center"
              minH="75px"
              boxShadow="0 2px 8px rgba(39, 153, 137, 0.3)">
              <Icon as={MdLocationOn} boxSize={{ base: 6, md: 8 }} mr={2} />
              <Text>Congratulation</Text>
            </Flex>

            {/* Success Content */}
            <Box p={{ base: 8, md: 12 }} pb={{ base: 10, md: 16 }} bg="white">
              <VStack spacing={8}>
                <Text
                  fontSize={{ base: "22px", md: "26px" }}
                  fontWeight="bold"
                  textAlign="center"
                  color="#3f3f3f">
                  Confirmation successfully completed
                </Text>

                {/* Animated Circle Loader with Checkmark */}
                <Box position="relative" display="inline-block" my={6}>
                  <Box
                    w="120px"
                    h="120px"
                    borderRadius="50%"
                    border="4px solid"
                    borderColor={isComplete ? "#5cb85c" : "rgba(0, 0, 0, 0.1)"}
                    borderLeftColor={!isComplete ? "#5cb85c" : "#5cb85c"}
                    sx={{
                      animation: !isComplete
                        ? "spin 1.2s infinite linear"
                        : "none",
                      "@keyframes spin": {
                        from: { transform: "rotate(0deg)" },
                        to: { transform: "rotate(360deg)" },
                      },
                    }}
                    transition="border 500ms ease-out"
                    position="relative"
                    boxShadow={
                      isComplete
                        ? "0 4px 20px rgba(92, 184, 92, 0.3)"
                        : "0 2px 10px rgba(0,0,0,0.1)"
                    }>
                    {isComplete && (
                      <Icon
                        as={MdCheck}
                        position="absolute"
                        top="50%"
                        left="50%"
                        transform="translate(-50%, -50%)"
                        boxSize="70px"
                        color="#5cb85c"
                        sx={{
                          animation: "checkmark 800ms ease",
                          "@keyframes checkmark": {
                            "0%": {
                              opacity: 0,
                              transform: "translate(-50%, -50%) scale(0)",
                            },
                            "100%": {
                              opacity: 1,
                              transform: "translate(-50%, -50%) scale(1)",
                            },
                          },
                        }}
                      />
                    )}
                  </Box>
                </Box>

                <Text
                  fontSize={{ base: "18px", md: "20px" }}
                  textAlign="center"
                  color="#8b8b8b"
                  fontWeight="500">
                  We will email you a confirmation
                </Text>
              </VStack>
            </Box>
          </Box>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
};

export default Complete;
