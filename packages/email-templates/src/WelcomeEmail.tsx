import { Body, Button, Container, Heading, Html, Preview, Text } from '@react-email/components';

type WelcomeEmailProps = {
  employeeName: string;
  companyName: string;
  loginUrl: string;
};

export function WelcomeEmail(props: WelcomeEmailProps): React.ReactElement {
  return (
    <Html>
      <Preview>Welcome to {props.companyName}</Preview>
      <Body style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 24px', backgroundColor: '#ffffff' }}>
          <Heading style={{ margin: '0 0 16px' }}>Welcome to {props.companyName}</Heading>
          <Text style={{ margin: '0 0 12px' }}>Hi {props.employeeName},</Text>
          <Text style={{ margin: '0 0 20px' }}>Your HRMS account is ready. You can sign in using your work email.</Text>
          <Button
            href={props.loginUrl}
            style={{
              display: 'inline-block',
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: '#111827',
              color: '#ffffff',
              textDecoration: 'none',
            }}
          >
            Sign in
          </Button>
        </Container>
      </Body>
    </Html>
  );
}

export function welcomeText(props: WelcomeEmailProps): string {
  return `Hi ${props.employeeName}, welcome to ${props.companyName}. Login: ${props.loginUrl}`;
}
