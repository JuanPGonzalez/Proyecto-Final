const fs = require('fs');

const path = 'c:/Users/Juampo/Documents/GitHub/Proyecto-Final/frontend/src/pages/AdminUsers.jsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Update initial formData state
code = code.replace(
  `  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    tipoUsuario: 'cliente'
  });`,
  `  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    tipoUsuario: 'cliente',
    sexo: 'Indefinido',
    fechaNac: '',
    direccion: 'Desconocida',
    dni: '',
    fechaReg: ''
  });`
);

// 2. Update reset in handleSubmit
code = code.replace(
  `setFormData({ name: '', email: '', password: '', tipoUsuario: 'cliente' });`,
  `setFormData({ name: '', email: '', password: '', tipoUsuario: 'cliente', sexo: 'Indefinido', fechaNac: '', direccion: 'Desconocida', dni: '', fechaReg: '' });`
);

// Update reset in "Nuevo Usuario" button
code = code.replace(
  `setFormData({ name: '', email: '', password: '', tipoUsuario: 'cliente' });`,
  `setFormData({ name: '', email: '', password: '', tipoUsuario: 'cliente', sexo: 'Indefinido', fechaNac: '', direccion: 'Desconocida', dni: '', fechaReg: '' });`
);

// 3. Update handleSubmit payload
code = code.replace(
  `        await axios.put(\`http://localhost:5000/api/admin/users/\${editingUser.id}\`, {
          name: formData.name,
          email: formData.email,
          tipoUsuario: formData.tipoUsuario
        }, { headers: { Authorization: \`Bearer \${token}\` } });`,
  `        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        await axios.put(\`http://localhost:5000/api/admin/users/\${editingUser.id}\`, payload, { headers: { Authorization: \`Bearer \${token}\` } });`
);

// 4. Update openEdit to load new fields
code = code.replace(
  `      name: user.name,
      email: user.email,
      password: '', // No editar password desde aca de manera simple por seguridad
      tipoUsuario: user.tipo_usuario || user.tipoUsuario`,
  `      name: user.name || '',
      email: user.email || '',
      password: '',
      tipoUsuario: user.tipo_usuario || user.tipoUsuario || 'cliente',
      sexo: user.sexo || 'Indefinido',
      fechaNac: user.fechaNac ? user.fechaNac.split('T')[0] : '',
      direccion: user.direccion || 'Desconocida',
      dni: user.dni || '',
      fechaReg: user.fechaReg ? user.fechaReg.split('T')[0] : ''`
);

// 5. Add new fields to the form
const formFieldsReplacement = `
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label className="input-field" style={{ border: 'none', padding: 0, fontWeight: 600, display: 'block', marginBottom: '5px' }}>Nombre</label>
              <input type="text" className="input-field" value={formData.name} onChange={e => { const value = e.target.value.replace(/\\s/g, ''); setFormData({...formData, name: value}); }} required />
            </div>
            <div>
              <label className="input-field" style={{ border: 'none', padding: 0, fontWeight: 600, display: 'block', marginBottom: '5px' }}>Email</label>
              <input type="email" className="input-field" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
            </div>
            
            <div>
              <label className="input-field" style={{ border: 'none', padding: 0, fontWeight: 600, display: 'block', marginBottom: '5px' }}>DNI</label>
              <input type="number" className="input-field" value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})} />
            </div>
            <div>
              <label className="input-field" style={{ border: 'none', padding: 0, fontWeight: 600, display: 'block', marginBottom: '5px' }}>Sexo</label>
              <select className="input-field" style={{ background: 'var(--background)' }} value={formData.sexo} onChange={e => setFormData({...formData, sexo: e.target.value})}>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
                <option value="Indefinido">Indefinido</option>
              </select>
            </div>

            <div>
              <label className="input-field" style={{ border: 'none', padding: 0, fontWeight: 600, display: 'block', marginBottom: '5px' }}>Fecha de Nacimiento</label>
              <input type="date" className="input-field" value={formData.fechaNac} onChange={e => setFormData({...formData, fechaNac: e.target.value})} />
            </div>
            <div>
              <label className="input-field" style={{ border: 'none', padding: 0, fontWeight: 600, display: 'block', marginBottom: '5px' }}>Fecha de Registro</label>
              <input type="date" className="input-field" value={formData.fechaReg} onChange={e => setFormData({...formData, fechaReg: e.target.value})} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="input-field" style={{ border: 'none', padding: 0, fontWeight: 600, display: 'block', marginBottom: '5px' }}>Dirección</label>
              <input type="text" className="input-field" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} />
            </div>

            {!editingUser && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="input-field" style={{ border: 'none', padding: 0, fontWeight: 600, display: 'block', marginBottom: '5px' }}>Contraseña</label>
                <PasswordInput className="input-field" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
              </div>
            )}
            
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="input-field" style={{ border: 'none', padding: 0, fontWeight: 600, display: 'block', marginBottom: '5px' }}>Rol</label>
              <select className="input-field" style={{ background: 'var(--background)' }} value={formData.tipoUsuario} onChange={e => setFormData({...formData, tipoUsuario: e.target.value})}>
                <option value="cliente">Cliente</option>
                <option value="administrador">Administrador</option>
              </select>
            </div>
          </div>
`;

// Replace the old form fields from "<div>\n            <label ... Nombre" until "</select>\n          </div>"
const formStart = code.indexOf('          <div>\n            <label className="input-field" style={{ border: \'none\', padding: 0, fontWeight: 600, display: \'block\', marginBottom: \'5px\' }}>Nombre</label>');
const formEnd = code.indexOf('          <button type="submit"', formStart);

if (formStart !== -1 && formEnd !== -1) {
  code = code.substring(0, formStart) + formFieldsReplacement + code.substring(formEnd);
} else {
  console.log("Could not find form fields in AdminUsers.jsx");
}

// 6. Add History button to the table
// Import History if not imported
code = code.replace("import { Edit2, Trash2, Plus, X, Search } from 'lucide-react';", "import { Edit2, Trash2, Plus, X, Search, History } from 'lucide-react';");

const oldButtons = `<td style={{ padding: '15px', textAlign: 'right' }}>
                    <button className="btn-icon" onClick={() => openEdit(u)} style={{ marginRight: '10px', color: 'var(--primary)' }} title="Editar"><Edit2 size={18} /></button>
                    <button className="btn-icon" onClick={() => handleDelete(u.id)} style={{ color: 'var(--destructive)' }} title="Eliminar"><Trash2 size={18} /></button>
                  </td>`;

const newButtons = `<td style={{ padding: '15px', textAlign: 'right' }}>
                    <button className="btn-icon" onClick={() => navigate('/admin/orders', { state: { searchUserId: String(u.id) } })} style={{ marginRight: '10px', color: '#10b981' }} title="Ver Historial de Compras"><History size={18} /></button>
                    <button className="btn-icon" onClick={() => openEdit(u)} style={{ marginRight: '10px', color: 'var(--primary)' }} title="Editar"><Edit2 size={18} /></button>
                    <button className="btn-icon" onClick={() => handleDelete(u.id)} style={{ color: 'var(--destructive)' }} title="Eliminar"><Trash2 size={18} /></button>
                  </td>`;

code = code.replace(oldButtons, newButtons);

fs.writeFileSync(path, code);
console.log("AdminUsers.jsx updated successfully!");
