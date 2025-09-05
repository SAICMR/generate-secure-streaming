import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`
    <html>
      <head>
        <title>Generate Secure Streaming - UI</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 2rem; line-height: 1.4; max-width: 900px; }
          h1 { margin-bottom: 0.5rem; }
          section { border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; margin: 1rem 0; }
          label { display: block; font-size: 0.9rem; color: #374151; margin-top: 0.5rem; }
          input, select { width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; }
          button { background: #111827; color: white; border: 0; padding: 0.5rem 0.8rem; border-radius: 6px; cursor: pointer; margin-top: 0.75rem; }
          button:hover { background: #1f2937; }
          .row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
          pre { background: #0b1021; color: #d1d5db; padding: 0.75rem; border-radius: 6px; overflow: auto; }
          small { color: #6b7280; }
          a { color: #2563eb; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <h1>Generate Secure Streaming</h1>
        <p>Minimal UI to exercise the API.</p>

        <section>
          <h2>Auth</h2>
          <div class="row">
            <div>
              <label>Email</label>
              <input id="email" placeholder="admin@example.com" />
            </div>
            <div>
              <label>Password</label>
              <input id="password" type="password" placeholder="pass" />
            </div>
          </div>
          <button id="signupBtn">Sign Up</button>
          <button id="loginBtn">Login</button>
          <p><small>Token: <code id="tokenOut">(none)</code></small></p>
        </section>

        <section>
          <h2>Upload Media</h2>
          <div class="row">
            <div>
              <label>Title</label>
              <input id="title" placeholder="Demo" />
            </div>
            <div>
              <label>Type</label>
              <select id="mtype"><option value="video">video</option><option value="audio">audio</option></select>
            </div>
          </div>
          <label>File</label>
          <input id="file" type="file" />
          <button id="uploadBtn">Upload</button>
          <p><small>Media ID: <code id="mediaIdOut">(none)</code></small></p>
        </section>

        <section>
          <h2>Secure Stream URL</h2>
          <div class="row">
            <div>
              <label>Media ID</label>
              <input id="streamMediaId" placeholder="paste media id" />
            </div>
          </div>
          <button id="streamUrlBtn">Generate Stream URL</button>
          <p><small>URL: <a id="streamUrlOut" href="#" target="_blank">(none)</a></small></p>
        </section>

        <section>
          <h2>Log View</h2>
          <div class="row">
            <div>
              <label>Media ID</label>
              <input id="viewMediaId" placeholder="paste media id" />
            </div>
          </div>
          <button id="viewBtn">POST /media/:id/view</button>
        </section>

        <section>
          <h2>Analytics</h2>
          <div class="row">
            <div>
              <label>Media ID</label>
              <input id="analyticsMediaId" placeholder="paste media id" />
            </div>
          </div>
          <button id="analyticsBtn">GET /media/:id/analytics</button>
          <pre id="analyticsOut">{}</pre>
        </section>

        <section>
          <h2>Resume Upload</h2>
          <input id="resumeFile" type="file" />
          <button id="resumeBtn">Upload Resume</button>
          <p><small>Browse uploads at <a href="/static" target="_blank">/static</a></small></p>
        </section>

        <script>
          const $ = (id) => document.getElementById(id);
          let token = '';

          const authHeaders = () => token ? { 'Authorization': 'Bearer ' + token } : {};
          const setToken = (t) => { token = t || ''; $('tokenOut').textContent = token || '(none)'; };

          $('signupBtn').onclick = async () => {
            const res = await fetch('/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: $('email').value, password: $('password').value }) });
            alert('Signup: ' + res.status);
          };

          $('loginBtn').onclick = async () => {
            const res = await fetch('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: $('email').value, password: $('password').value }) });
            const data = await res.json().catch(() => ({}));
            setToken(data.token);
          };

          $('uploadBtn').onclick = async () => {
            const fd = new FormData();
            fd.append('title', $('title').value);
            fd.append('type', $('mtype').value);
            if ($('file').files[0]) fd.append('file', $('file').files[0]);
            const res = await fetch('/media', { method: 'POST', headers: authHeaders(), body: fd });
            const data = await res.json().catch(() => ({}));
            $('mediaIdOut').textContent = data.id || '(none)';
            $('streamMediaId').value = data.id || '';
            $('viewMediaId').value = data.id || '';
            $('analyticsMediaId').value = data.id || '';
          };

          $('streamUrlBtn').onclick = async () => {
            const id = $('streamMediaId').value;
            const res = await fetch('/media/' + encodeURIComponent(id) + '/stream-url', { headers: authHeaders() });
            const data = await res.json().catch(() => ({}));
            const a = $('streamUrlOut');
            a.textContent = data.url || '(none)';
            if (data.url) a.href = data.url; else a.removeAttribute('href');
          };

          $('viewBtn').onclick = async () => {
            const id = $('viewMediaId').value;
            const res = await fetch('/media/' + encodeURIComponent(id) + '/view', { method: 'POST', headers: authHeaders() });
            alert('View logged: ' + res.status);
          };

          $('analyticsBtn').onclick = async () => {
            const id = $('analyticsMediaId').value;
            const res = await fetch('/media/' + encodeURIComponent(id) + '/analytics', { headers: authHeaders() });
            const data = await res.json().catch(() => ({}));
            $('analyticsOut').textContent = JSON.stringify(data, null, 2);
          };

          $('resumeBtn').onclick = async () => {
            const fd = new FormData();
            if ($('resumeFile').files[0]) fd.append('resume', $('resumeFile').files[0]);
            const res = await fetch('/resume/upload', { method: 'POST', body: fd });
            const data = await res.json().catch(() => ({}));
            alert('Resume: ' + res.status + (data.url ? ' → ' + data.url : ''));
          };
        </script>
      </body>
    </html>
  `);
});

export default router;


