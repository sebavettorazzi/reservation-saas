const { execFileSync, spawnSync } = require("node:child_process");
const { existsSync } = require("node:fs");

const MIN_NODE = { major: 20, minor: 19 };

function check(name, run) {
  try {
    const result = run();
    console.log(`[ok] ${name}${result ? `: ${result}` : ""}`);
    return true;
  } catch (error) {
    console.log(`[fail] ${name}: ${error.message}`);
    return false;
  }
}

function commandOutput(command, args) {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function compareNodeVersion(version) {
  const [major, minor] = version.replace(/^v/, "").split(".").map(Number);

  return major > MIN_NODE.major || (major === MIN_NODE.major && minor >= MIN_NODE.minor);
}

const checks = [
  check("Node compatible", () => {
    const version = process.version;

    if (!compareNodeVersion(version)) {
      throw new Error(`${version} detectado. Usar Node 22 o al menos 20.19.`);
    }

    return version;
  }),
  check("Archivo .env", () => {
    if (!existsSync(".env")) {
      throw new Error("falta .env. Crear desde .env.example.");
    }

    return "presente";
  }),
  check("Dependencias", () => {
    if (!existsSync("node_modules")) {
      throw new Error("falta node_modules. Ejecutar npm ci con Node 22.");
    }

    return "instaladas";
  }),
  check("Docker", () => commandOutput("docker", ["ps", "--format", "{{.Names}}"])),
  check("PostgreSQL local", () => {
    const output = commandOutput("docker", ["ps", "--filter", "name=reservation-saas-db", "--format", "{{.Status}}"]);

    if (!output) {
      throw new Error("contenedor reservation-saas-db no encontrado. Ejecutar npm run db:up.");
    }

    return output;
  }),
  check("Prisma schema", () => {
    const result = spawnSync(process.execPath, ["./node_modules/prisma/build/index.js", "validate"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });

    if (result.status !== 0) {
      throw new Error((result.stderr || result.stdout).trim() || "validacion fallida");
    }

    return "valido";
  }),
];

const failed = checks.filter((passed) => !passed).length;

if (failed > 0) {
  console.log(`\n${failed} chequeo/s requieren atencion antes de levantar el proyecto.`);
  process.exit(1);
}

console.log("\nProyecto listo para levantar.");
