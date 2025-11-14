export default function Test() {
  return (
    <div style={{ 
      color: 'white', 
      padding: '50px',
      backgroundColor: '#000',
      minHeight: '100vh'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>✅ TEST PAGE WORKING</h1>
      <p style={{ fontSize: '24px' }}>If you see this, React is rendering correctly</p>
      <p style={{ fontSize: '18px', marginTop: '20px' }}>
        Timestamp: {new Date().toISOString()}
      </p>
    </div>
  );
}
