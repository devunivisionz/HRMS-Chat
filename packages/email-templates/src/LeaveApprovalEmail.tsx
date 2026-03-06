import {
  Body,
  Button,
  Container,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from '@react-email/components';

type LeaveApprovalEmailProps = {
  employeeName: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  days: number;
  status: 'APPROVED' | 'REJECTED';
  approvedBy: string;
  remaining: number;
  loginUrl: string;
};

export function LeaveApprovalEmail(props: LeaveApprovalEmailProps): React.ReactElement {
  const title = props.status === 'APPROVED' ? 'Leave Approved' : 'Leave Update';

  return (
    <Html>
      <Preview>{title}</Preview>
      <Body style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 24px', backgroundColor: '#ffffff' }}>
          <Heading style={{ margin: '0 0 16px' }}>{title}</Heading>
          <Text style={{ margin: '0 0 12px' }}>Hi {props.employeeName},</Text>
          <Text style={{ margin: '0 0 12px' }}>
            Your {props.leaveType} leave request ({props.fromDate} to {props.toDate}, {props.days} days) has been{' '}
            {props.status.toLowerCase()} by {props.approvedBy}.
          </Text>
          <Text style={{ margin: '0 0 12px' }}>Remaining balance: {props.remaining} days</Text>
          <Hr style={{ margin: '24px 0' }} />
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
            View in HRMS
          </Button>
          <Text style={{ margin: '24px 0 0', fontSize: '12px', color: '#6b7280' }}>
            If you didn’t request this, you can ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function leaveApprovalText(props: LeaveApprovalEmailProps): string {
  return `Hi ${props.employeeName}, your ${props.leaveType} leave request (${props.fromDate} to ${props.toDate}, ${props.days} days) has been ${props.status.toLowerCase()} by ${props.approvedBy}. Remaining balance: ${props.remaining}. Open: ${props.loginUrl}`;
}
