import * as React from "react";
import { Html, Head, Font, Body, Preview, Section, Row, Heading, Text } from "@react-email/components";

interface InvitationEmailProps {
    email: string;
    invitedBy: string;
    boardName: string;
}

export function InvitationEmail({ email, invitedBy, boardName }: InvitationEmailProps) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const invitationLink = `${baseUrl}/sign-in`;

    return (
        <Html lang="en">
            <Head>
                <title>{`Invitation by ${invitedBy}`}</title>
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

            <Preview>You&apos;ve been invited to join {boardName} by {invitedBy}.</Preview>
            <Body>
                <Section>
                    <Row>
                        <Heading as="h1">Hello, {email}</Heading>
                    </Row>
                    <Row>
                        <Text>
                            You&apos;ve been invited by <strong>{invitedBy}</strong> to collaborate on the board{" "}
                            <strong>{boardName}</strong>.
                        </Text>
                    </Row>
                    <Row>
                        <Text>
                            Please register to join the board and start collaborating with your team.
                        </Text>
                    </Row>
                    <Row>
                        <Text>
                            <a href={invitationLink} target="_blank" rel="noopener noreferrer">
                                Join your team
                            </a>
                        </Text>
                    </Row>
                    <Row>
                        <Text>
                            If you did not expect this invitation, you can safely ignore this email.
                        </Text>
                    </Row>
                </Section>
            </Body>
        </Html>
    );
}
