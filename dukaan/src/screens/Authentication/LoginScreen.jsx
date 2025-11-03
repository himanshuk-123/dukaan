import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';

// import {MaterialCommunityIcons} from '@react-native-vector-icons/material-community';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Floating label animations
  const emailLabelAnim = useRef(new Animated.Value(0)).current;
  const passwordLabelAnim = useRef(new Animated.Value(0)).current;
  const formSlideAnim = useRef(new Animated.Value(30)).current;
  const formFadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(formSlideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(formFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const animateLabel = (anim, toValue) => {
    Animated.timing(anim, {
      toValue,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  const handleEmailFocus = () => {
    animateLabel(emailLabelAnim, 1);
  };

  const handleEmailBlur = () => {
    if (!email) {
      animateLabel(emailLabelAnim, 0);
    }
  };

  const handlePasswordFocus = () => {
    animateLabel(passwordLabelAnim, 1);
  };

  const handlePasswordBlur = () => {
    if (!password) {
      animateLabel(passwordLabelAnim, 0);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Welcome!', 'Successfully logged in to Dukaan');
      // navigation.navigate('Home');
    }, 1500);
  };

  const handleForgotPassword = () => {
    Alert.alert('Reset Password', 'Password reset feature will be implemented');
  };

  const handleSignUp = () => {
    Alert.alert('Sign Up', 'Navigate to registration screen');
    // navigation.navigate('Register');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Floating label styles
  const emailLabelStyle = {
    position: 'absolute',
    left: 15,
    top: emailLabelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [18, -8],
    }),
    fontSize: emailLabelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: emailLabelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['#808080', '#008080'],
    }),
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
    zIndex: 1,
  };

  const passwordLabelStyle = {
    position: 'absolute',
    left: 15,
    top: passwordLabelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [18, -8],
    }),
    fontSize: passwordLabelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: passwordLabelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['#808080', '#008080'],
    }),
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
    zIndex: 1,
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Branding Section */}
        <View style={styles.brandingContainer}>
          {/* <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="storefront" size={48} color="#008080" />
          </View> */}
          <Text style={styles.welcomeText}>Welcome Back!</Text>
          <Text style={styles.subtitleText}>Log In to Your Market</Text>
        </View>

        {/* Login Form */}
        <Animated.View 
          style={[
            styles.formContainer,
            {
              opacity: formFadeAnim,
              transform: [{ translateY: formSlideAnim }]
            }
          ]}
        >
          {/* Email Input with Floating Label */}
          <View style={styles.inputWrapper}>
            <Animated.Text style={emailLabelStyle}>
              Email
            </Animated.Text>
            <TextInput
              style={[
                styles.textInput,
                errors.email && styles.inputError
              ]}
              placeholder={email ? '' : 'Email'}
              placeholderTextColor="#808080"
              value={email}
              onChangeText={setEmail}
              onFocus={handleEmailFocus}
              onBlur={handleEmailBlur}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          {/* Password Input with Floating Label */}
          <View style={styles.inputWrapper}>
            <Animated.Text style={passwordLabelStyle}>
              Password
            </Animated.Text>
            <TextInput
              style={[
                styles.textInput,
                errors.password && styles.inputError
              ]}
              placeholder={password ? '' : 'Password'}
              placeholderTextColor="#808080"
              value={password}
              onChangeText={setPassword}
              onFocus={handlePasswordFocus}
              onBlur={handlePasswordBlur}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={togglePasswordVisibility}
            >
              {/* <MaterialCommunityIcons 
                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color="#808080" 
              /> */}
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          {/* Utility Options */}
          <View style={styles.utilityContainer}>
            <TouchableOpacity 
              style={styles.rememberContainer}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View style={styles.checkbox}>
                {/* {rememberMe && (
                  <MaterialCommunityIcons name="check" size={16} color="#008080" />
                )} */}
              </View>
              <Text style={styles.rememberText}>Remember Me</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity 
            style={[
              styles.loginButton,
              isLoading && styles.loginButtonDisabled
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Animated.View style={styles.spinner} />
                <Text style={styles.loginButtonText}>Signing In...</Text>
              </View>
            ) : (
              <Text style={styles.loginButtonText}>LOGIN</Text>
            )}
          </TouchableOpacity>

          {/* Sign Up Section */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <TouchableOpacity onPress={handleSignUp}>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: height * 0.1,
    paddingBottom: 40,
  },
  brandingContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F1F3F4',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  subtitleText: {
    fontSize: 16,
    color: '#808080',
    fontFamily: 'Inter-Regular',
  },
  formContainer: {
    width: '100%',
    alignItems: 'center',
  },
  inputWrapper: {
    width: '90%',
    marginBottom: 8,
  },
  textInput: {
    width: '100%',
    height: 56,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
    fontFamily: 'Inter-Regular',
  },
  inputError: {
    borderColor: '#FF0000',
  },
  errorText: {
    width: '90%',
    color: '#FF0000',
    fontSize: 12,
    marginBottom: 16,
    marginLeft: 4,
    fontFamily: 'Inter-Regular',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 18,
    padding: 4,
  },
  utilityContainer: {
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 8,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#008080',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  rememberText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontFamily: 'Inter-Regular',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#FFA500',
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  loginButton: {
    width: '90%',
    height: 56,
    backgroundColor: '#008080',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spinner: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderTopColor: 'transparent',
    borderRadius: 8,
    marginRight: 8,
  },
  signUpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontFamily: 'Inter-Regular',
  },
  signUpLink: {
    fontSize: 14,
    color: '#FFA500',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});

// For font loading, you'll need to set up custom fonts in your project
// This is how you would typically handle fonts (commented out as it requires additional setup)
/*
import { useFonts } from 'expo-font';

const [fontsLoaded] = useFonts({
  'Poppins-SemiBold': require('./assets/fonts/Poppins-SemiBold.ttf'),
  'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
  'Inter-Medium': require('./assets/fonts/Inter-Medium.ttf'),
  'Inter-SemiBold': require('./assets/fonts/Inter-SemiBold.ttf'),
});
*/

export default LoginScreen;