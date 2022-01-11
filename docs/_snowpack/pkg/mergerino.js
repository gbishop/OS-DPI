const e=Object.assign||((e,t)=>(t&&Object.keys(t).forEach(o=>e[o]=t[o]),e)),t=(e,r,s)=>{const c=typeof s;if(s&&"object"===c)if(Array.isArray(s))for(const o of s)r=t(e,r,o);else for(const c of Object.keys(s)){const f=s[c];"function"==typeof f?r[c]=f(r[c],o):void 0===f?e&&!isNaN(c)?r.splice(c,1):delete r[c]:null===f||"object"!=typeof f||Array.isArray(f)?r[c]=f:"object"==typeof r[c]?r[c]=f===r[c]?f:o(r[c],f):r[c]=t(!1,{},f);}else "function"===c&&(r=s(r,o));return r},o=(o,...r)=>{const s=Array.isArray(o);return t(s,s?o.slice():e({},o),r)};

export default o;
