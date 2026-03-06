import { Body, Button, Container, Heading, Html, Preview, Text } from '@react-email/components';

type MentionDigestEmailItem = {
  channelName: string;
  snippet: string;
  url: string;
  mentionedBy: string;
  at: string;
};

type MentionDigestEmailProps = {
  employeeName: string;
  items: MentionDigestEmailItem[];
  loginUrl: string;
};

export function MentionDigestEmail(props: MentionDigestEmailProps): React.ReactElement {
  return (
    <Html>
      <Preview>You were mentioned</Preview>
      <Body style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 24px', backgroundColor: '#ffffff' }}>
          <Heading style={{ margin: '0 0 16px' }}>You were mentioned</Heading>
          <Text style={{ margin: '0 0 12px' }}>Hi {props.employeeName},</Text>
          <Text style={{ margin: '0 0 20px' }}>Here’s a quick digest of recent @mentions:</Text>

          {props.items.slice(0, 20).map((item, idx) => (
            <Container key={`${item.url}-${idx}`} style={{ padding: '12px 0' }}>
              <Text style={{ margin: '0 0 4px' }}>
                <strong>{item.mentionedBy}</strong> in <strong>#{item.channelName}</strong> ({item.at})
              </Text>
              <Text style={{ margin: '0 0 4px', color: '#374151' }}>{item.snippet}</Text>
              <Text style={{ margin: '0', color: '#2563eb' }}>{item.url}</Text>
            </Container>
          ))}

          <Button
            href={props.loginUrl}
            style={{
              display: 'inline-block',
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: '#111827',
              color: '#ffffff',
              textDecoration: 'none',
              marginTop: '12px',
            }}
          >
            Open HRMS
          </Button>
        </Container>
      </Body>
    </Html>
  );
}

export function mentionDigestText(props: MentionDigestEmailProps): string {
  const lines = props.items
    .slice(0, 20)
    .map((i) => `- ${i.mentionedBy} in #${i.channelName} (${i.at}): ${i.snippet} → ${i.url}`)
    .join('\n');

  return `Hi ${props.employeeName},\n\nRecent @mentions:\n${lines}\n\nOpen HRMS: ${props.loginUrl}`;
}
