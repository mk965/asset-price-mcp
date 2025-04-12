import { test } from 'node:test';
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, '..', 'build', 'index.js');

// 测试MCP服务器是否正确启动并响应请求
test('MCP server starts and responds to requests', async (t) => {
  // 启动MCP服务器
  const mcp = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let stderrData = '';
  mcp.stderr.on('data', (data) => {
    stderrData += data.toString();
    console.error('Server stderr:', data.toString());
  });
  
  // 等待服务器启动
  await sleep(1000);
  
  // 监听服务器响应
  const responsePromise = new Promise((resolve) => {
    let responseData = '';
    mcp.stdout.on('data', (data) => {
      const chunk = data.toString();
      console.log('Raw server response chunk:', chunk);
      responseData += chunk;
      try {
        const response = JSON.parse(responseData);
        console.log('Parsed response:', JSON.stringify(response, null, 2));
        resolve(response);
      } catch (e) {
        // 等待更多数据
        console.log('JSON parse error (waiting for more data):', e.message);
      }
    });
  });
  
  // 发送请求
  const request = {
    jsonrpc: "2.0",
    method: "tools/call",
    params: {
      name: "get_asset_price",
      arguments: {}
    },
    id: 1
  };
  
  console.log('Sending request:', JSON.stringify(request, null, 2));
  mcp.stdin.write(JSON.stringify(request) + '\n');
  
  // 等待响应
  const response = await Promise.race([
    responsePromise,
    sleep(5000).then(() => {
      console.error('Server stderr so far:', stderrData);
      throw new Error('Response timeout after 5 seconds');
    })
  ]);
  
  // 输出完整响应进行调试
  console.log('Complete response received:', JSON.stringify(response, null, 2));
  
  // 检查是否有错误响应
  if (response.error) {
    console.error('Server returned error:', response.error);
    assert.fail(`Server returned error: ${JSON.stringify(response.error)}`);
  }
  
  // 验证响应
  assert.strictEqual(response.jsonrpc, "2.0", "Response should have jsonrpc version");
  assert.strictEqual(response.id, 1, "Response ID should match request ID");
  assert.ok(response.result, "Response should contain a result");
  assert.ok(Array.isArray(response.result.content), "Result should contain content array");
  assert.ok(response.result.content.length > 0, "Content array should not be empty");
  assert.strictEqual(response.result.content[0].type, "text");
  assert.ok(response.result.content[0].text.includes("Current Asset Prices"), "Response should contain asset prices");
  
  // 关闭MCP服务器
  mcp.kill();
  
  // 等待进程结束
  await new Promise(resolve => mcp.on('close', resolve));
}); 