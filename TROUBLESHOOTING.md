# Troubleshooting

Common issues and solutions for the LLM-Agnostic Apps SDK.

## Server Issues (Frontend + API)

### MCP Server Not Starting
**Error**: `Error: Port 3000 already in use`

**Solution**:
```bash
# Find process using port
lsof -i :3000
# Kill process
kill -9 <PID>
# Or use different port
PORT=3001 bun run dev
```

### LLM Connection Failed
**Error**: `LLM provider connection timeout`

**Solutions**:
- Check API keys in `.env`
- Verify network connectivity
- For Ollama: Ensure Ollama is running (`ollama serve`)
- For LM Studio: Ensure local server is running
- For custom APIs: Check endpoint availability

### Database Connection Error
**Error**: `Unable to connect to database`

**Solutions**:
- Verify `DATABASE_URL` in `.env`
- For SQLite: Ensure file permissions
- For PostgreSQL: Check credentials and network

## Frontend Issues

### Component Not Rendering
**Error**: Blank iframe or "Component failed to load"

**Solutions**:
- Check browser console for CSP errors
- Verify component bundle is built (`bun run build`)
- Ensure the Bun server in `src/server` serves component resources
- Check CORS headers

### Bridge API Not Working
**Error**: `window.bridge is undefined`

**Solutions**:
- Component must run in an iframe served by the Bun server (`src/server`)
- Check iframe `src` points to correct endpoint
- Verify bridge script is loaded

### Styling Issues
**Error**: Component looks broken

**Solutions**:
- Check CSS variables are set
- Verify theme support
- Test responsive breakpoints

## MCP Protocol Issues

### Tool Not Found
**Error**: `Tool 'xyz' not found`

**Solutions**:
- Verify tool is registered in server
- Check tool name matches exactly
- Restart MCP server after changes

### Invalid Tool Input
**Error**: `Input validation failed`

**Solutions**:
- Verify parameter names and types
- Update schema if tool interface changed

### Authentication Required
**Error**: `401 Unauthorized`

**Solutions**:
- Check OAuth configuration
- Verify user is logged in
- Confirm token is valid and not expired

## Deployment Issues

### Build Failures
**Error**: `Build failed`

**Solutions**:
- Clear node_modules: `rm -rf node_modules && bun install`
- Check Bun.js version compatibility
- Verify all dependencies are installed

### Runtime Errors in Production
**Error**: `Module not found`

**Solutions**:
- Ensure all files are included in build
- Check import paths
- Verify environment variables

### Performance Issues
**Symptoms**: Slow response times

**Solutions**:
- Enable caching for static assets
- Optimize database queries
- Use connection pooling
- Implement rate limiting

## LLM-Specific Issues

### Ollama
- **Model Not Available**: `ollama pull <model>`
- **Connection Refused**: Start Ollama server
- **GPU Memory**: Reduce context size or use CPU

### LM Studio
- **Server Not Running**: Start LM Studio local server
- **Wrong Port**: Check configured port matches

### Custom API
- **Endpoint Unavailable**: Check API server status
- **Authentication Failed**: Verify API key format
- **Rate Limited**: Check API rate limits and backoff

## Development Tools

### MCP Inspector
```bash
npx @modelcontextprotocol/inspector
# Enter MCP server URL: http://localhost:3000/mcp
```

### Debugging Components
```javascript
// In browser console
console.log(window.bridge);
// Check bridge globals
console.log(window.bridge.toolOutput);
```

### Network Debugging
```bash
# Monitor requests
curl -v http://localhost:3000/mcp

# Check MCP protocol
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize"}'
```

## Common Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| 400 | Bad Request | Check input validation |
| 401 | Unauthorized | Verify authentication |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Verify endpoint/tool exists |
| 429 | Too Many Requests | Implement rate limiting |
| 500 | Internal Error | Check server logs |

## Getting Help

1. Check this troubleshooting guide
2. Review GitHub issues
3. Search documentation
4. Create a new issue with:
   - Error messages
   - Environment details
   - Steps to reproduce
   - Logs and screenshots

## Performance Tuning

### Backend
- Use Bun's native performance
- Implement caching (Redis)
- Optimize database queries
- Use streaming responses

### Frontend
- Code splitting
- Lazy loading
- Optimize bundle size
- Use React.memo for components

### LLM
- Cache tool results
- Batch requests when possible
- Use smaller models for simple tasks
- Implement request timeouts