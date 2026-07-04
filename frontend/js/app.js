const apiBaseUrl = "http://127.0.0.1:8000";

async function checkApiHealth() {
  try {
    const response = await fetch(`${apiBaseUrl}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

checkApiHealth();

