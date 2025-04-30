# Unique E-Learning Platform

A modern, secure e-learning platform with advanced proctoring capabilities for online exams and quizzes.

## Features

- 📚 **Course Management**
  - Create and manage courses
  - Add multimedia content (videos, documents)
  - Progress tracking

- 📝 **Exam System**
  - Create secure online exams
  - Multiple choice questions
  - Time-limited exams
  - Automatic grading

- 📱 **Advanced Proctoring**
  - Real-time webcam monitoring
  - Face detection
  - Tab switching detection
  - Instructor proctoring dashboard
  - Security event logging

- 📊 **Analytics & Reports**
  - Student performance tracking
  - Exam statistics
  - Security violation reports

## Tech Stack

- **Frontend**: Next.js 15.3.1 + React 19
- **UI Framework**: shadcn/ui + Tailwind CSS
- **State Management**: React Query
- **Authentication**: NextAuth.js
- **Database**: Prisma ORM + PostgreSQL
- **AI/ML**: TensorFlow.js for face detection
- **Real-time**: WebRTC for proctoring

## Prerequisites

- Node.js 18+ (Recommended)
- npm or yarn
- PostgreSQL 14+
- mkcert (for local HTTPS development)

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/MRQ67/unique-e-learning.git
cd unique-e-learning
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file in the root directory with:
```
DATABASE_URL="postgresql://user:password@localhost:5432/unique_elearning"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

4. **Initialize the database**
```bash
npx prisma generate
npx prisma migrate dev
```

5. **Generate SSL certificates** (for local development)
```bash
# Install mkcert
brew install mkcert  # macOS
# or
choco install mkcert  # Windows

# Generate certificates
mkcert -install
mkcert localhost 127.0.0.1 ::1
```

6. **Start the development server**
```bash
npm run dev
```

7. **For HTTPS development**
```bash
npm run serve
```

## Running the Application

- **Development Mode**
```bash
npm run dev
```
Access at: http://localhost:3000

- **Production Build**
```bash
npm run build
npm run start
```

- **HTTPS Development**
```bash
npm run serve
```
Access at: https://localhost:3000

## Security Features

- **Proctoring System**
  - Real-time face detection using TensorFlow.js
  - Tab switching detection
  - Security event logging
  - Instructor monitoring dashboard

- **Authentication**
  - Secure password hashing (bcrypt)
  - Session-based authentication
  - Role-based access control

- **Data Protection**
  - Encrypted database connections
  - Secure file uploads
  - Rate limiting
  - CSRF protection

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please:
- Open an issue on GitHub
- Contact the development team
- Check the documentation

## Acknowledgments

- Thanks to the Next.js team for their amazing framework
- Shoutout to the shadcn/ui team for their beautiful components
- Appreciation to TensorFlow.js for their AI capabilities
- Gratitude to all contributors and users

## Future Development

- Enhanced proctoring features
- Mobile app support
- Advanced analytics
- More question types
- Integration with LMS systems

## Security Notes

The platform uses advanced security measures including:
- HTTPS encryption
- Secure authentication
- Regular security audits
- Data encryption at rest
- Rate limiting
- CSRF protection

## Troubleshooting

### Common Issues

1. **Webcam Not Working**
   - Ensure HTTPS is enabled
   - Check browser permissions
   - Verify camera access

2. **Database Connection**
   - Verify DATABASE_URL
   - Check PostgreSQL service
   - Review logs for errors

3. **Authentication Problems**
   - Check NEXTAUTH_SECRET
   - Verify session configuration
   - Clear browser cache

For more detailed troubleshooting, please refer to the documentation or open an issue on GitHub.
