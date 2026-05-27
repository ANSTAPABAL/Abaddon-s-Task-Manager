Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd.exe /c npm run dev", 0, False
' Wait 3 seconds for server to boot up, then open browser
WScript.Sleep 3000
WshShell.Run "cmd.exe /c start http://127.0.0.1:5173", 0, False
