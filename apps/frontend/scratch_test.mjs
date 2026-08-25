import React from 'react';
import { renderToString } from 'react-dom/server';
import { Briefcase, Calendar, GraduationCap, Hash, IdCard, Mail, Phone, School, User, Mars, Venus, UserRound } from 'lucide-react';

const icons = [Briefcase, Calendar, GraduationCap, Hash, IdCard, Mail, Phone, School, User, Mars, Venus, UserRound];
icons.forEach(Icon => {
  try {
    renderToString(React.createElement(Icon, { className: "w-3.5" }));
    console.log("Success for icon");
  } catch (e) {
    console.error("Error for icon:", e.message);
  }
});
