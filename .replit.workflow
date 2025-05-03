[workflow]
name = "Start application"
author = "agent"

[[workflow.tasks]]
task = "shell.exec"
args = "./start_servers.sh"
waitForPorts = [5000, 8000]