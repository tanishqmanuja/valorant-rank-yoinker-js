package imports

import _ "embed"

//go:embed out/vryjs.mjs
var FallbackVryJSBundle []byte

//go:embed out/libsql.node
var LibSQLBinary []byte
