import * as React from 'react';
import { Html, Head, Font, Body, Preview, Section, Row, Heading, Text } from "@react-email/components";

interface VerificationEmailProps {
  username: string,
  otp: string
}

export function VerificationEmail({ username, otp }: VerificationEmailProps) {
  return (
    <Html lang="en">
      <Head>
        <title>Verification Code</title>
        <Font
          fontFamily="Roboto"
          fallbackFontFamily="Verdana"
          webFont={{
            url: "https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>

      <Preview>Here&apos;s your verification code: {otp}</Preview>
      <Section>
        <Row>
          <Heading as="h1">Hello {username}, </Heading>
        </Row>
        <Row>
          <Text>Thank you for registering. Use the below code for verification: </Text>
        </Row>
        <Row>
          <Text>{otp} </Text>
        </Row>
        <Row>
          <Text>
            If you did not request this code, please ignore this email.
          </Text>
        </Row>
      </Section>
    </Html>
  );
}

