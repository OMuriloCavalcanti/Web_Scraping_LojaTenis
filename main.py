import subprocess

print("Rodando WORKER 1...")
subprocess.run(
    ["node", "src/WorkerScrapping.js"],
    check=True
)
