import { Body, Button, Container, Heading, Html, Preview, Text } from '@react-email/components';

type PayslipReadyEmailProps = {
  employeeName: string;
  monthLabel: string;
  downloadUrl: string;
  loginUrl: string;
};

export function PayslipReadyEmail(props: PayslipReadyEmailProps): React.ReactElement {
  return (
    <Html>
      <Preview>Payslip Ready</Preview>
      <Body style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 24px', backgroundColor: '#ffffff' }}>
          <Heading style={{ margin: '0 0 16px' }}>Payslip Ready</Heading>
          <Text style={{ margin: '0 0 12px' }}>Hi {props.employeeName},</Text>
          <Text style={{ margin: '0 0 20px' }}>Your payslip for {props.monthLabel} is ready to download.</Text>
          <Button
            href={props.downloadUrl}
            style={{
              display: 'inline-block',
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: '#111827',
              color: '#ffffff',
              textDecoration: 'none',
              marginRight: '12px',
            }}
          >
            Download payslip
          </Button>
          <Button
            href={props.loginUrl}
            style={{
              display: 'inline-block',
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: '#e5e7eb',
              color: '#111827',
              textDecoration: 'none',
            }}
          >
            Open HRMS
          </Button>
        </Container>
      </Body>
    </Html>
  );
}

export function payslipReadyText(props: PayslipReadyEmailProps): string {
  return `Hi ${props.employeeName}, your payslip for ${props.monthLabel} is ready. Download: ${props.downloadUrl}. Login: ${props.loginUrl}`;
}
