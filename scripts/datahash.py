"""SHA-256 of the country files in data/ (basename then bytes, sorted), the same hash robustness.py records.
Every analysis output the paper uses records this hash; scripts/paper_gen.js refuses outputs whose hash differs (DECISION_RULES.md)."""
import glob, hashlib, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def data_sha256(root=ROOT):
    h = hashlib.sha256()
    for f in sorted(glob.glob(os.path.join(root, "data", "[A-Z][A-Z][A-Z].json"))):
        h.update(os.path.basename(f).encode())
        h.update(open(f, "rb").read())
    return h.hexdigest()


def write_sidecar(path, extra=None, root=ROOT):
    """For CSV outputs: write <path minus extension>.meta.json with the data hash."""
    meta = {"dataSha256": data_sha256(root), "output": os.path.basename(path)}
    meta.update(extra or {})
    json.dump(meta, open(os.path.splitext(path)[0] + ".meta.json", "w"), indent=1)
    return meta


if __name__ == "__main__":
    print(data_sha256(sys.argv[1] if len(sys.argv) > 1 else ROOT))
