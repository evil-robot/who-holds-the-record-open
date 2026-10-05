#!/bin/sh
# List the server's tools with a plain JSON-RPC call. The Accept header must name both types.
curl -s -X POST https://healthrecordrights.com/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
echo
# Call one tool: Finland in full.
curl -s -X POST https://healthrecordrights.com/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_country","arguments":{"country":"FIN"}}}'
echo
