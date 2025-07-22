#include <iostream>
#include <iomanip>
#include <string>
#include <vector>
#include <windows.h>
#undef max
#undef min
#include <chrono>
#include <thread>
#include <algorithm>
#include <numeric>
#include <conio.h>
#include <unordered_set>
#include <map>
#include <ctime>
#include <fstream>
#include <stdio.h>
#include <sys/stat.h>
#include <mutex>
#include <queue>
#include <atomic>
#include <condition_variable>
#include <sstream>
// Removed std::filesystem dependency
#include <direct.h> // For _mkdir on Windows
#include <corecrt_math_defines.h>
#include <complex>
// Removed fftw3.h
#include <functional>
#include <future>

// Forward declarations
class HantekDevice;
class MultiLogicAnalyzer;

// Constants for brain visualization output
const std::string OUTPUT_DIRECTORY = "C:\\Ashvajeet\\FULL_Setup\\brain-viz\\public\\data";
const std::string OUTPUT_FILENAME = "logic_data.txt";

// Device connection constants
const int MAX_DEVICES = 12;
const int MAX_RETRIES = 1;
const int CONNECTION_TIMEOUT_MS = 100;
// Trigger settings structure
struct TriggerSettings
{
    unsigned short nEdgeSignal;
    unsigned short nEdgeSlope;
    short Intr_Range;
    unsigned long Range_Max;
    unsigned long Range_Min;
    unsigned long Range_Sh;
    unsigned short Range_Mo;
    short Intr_Time;
    unsigned long Time_Max;
    unsigned long Time_Min;
    unsigned short Time_Mo;
    short Intr_Equ;
    unsigned long Equ_Sh;
    unsigned long Equ_Dat;
    unsigned short Equ_So;
};

// Configuration structure
struct AnalyzerConfig
{
    unsigned short sampleRateCode;
    unsigned long sampleDepth;
    int scanIntervalMs;
    double voltageThreshold;
    bool enableTrigger;
    unsigned short triggerChannel;
    bool triggerRisingEdge;
    std::string configFilePath;
    std::string serialNumber; // Added for device identification
    std::string model;        // Added for device info

    // Default values
    AnalyzerConfig()
        : sampleRateCode(8), sampleDepth(100000), scanIntervalMs(100), voltageThreshold(1.7),
          enableTrigger(false), triggerChannel(0), triggerRisingEdge(true),
          configFilePath("logic_config.txt"), serialNumber("Unknown"), model("Unknown")
    {
    }

    // Validation function
    bool isValid() const
    {
        return (sampleRateCode <= 12 &&
                sampleDepth >= 1000 && sampleDepth <= 32000000 &&
                scanIntervalMs >= 10 && scanIntervalMs <= 5000 &&
                voltageThreshold >= 0.5 && voltageThreshold <= 5.0 &&
                triggerChannel <= 31);
    }
};

// Console colors utility
class ConsoleColors
{
public:
    enum Color
    {
        BLACK = 0,
        BLUE = 1,
        GREEN = 2,
        CYAN = 3,
        RED = 4,
        MAGENTA = 5,
        BROWN = 6,
        LIGHTGRAY = 7,
        DARKGRAY = 8,
        LIGHTBLUE = 9,
        LIGHTGREEN = 10,
        LIGHTCYAN = 11,
        LIGHTRED = 12,
        LIGHTMAGENTA = 13,
        YELLOW = 14,
        WHITE = 15
    };

    static void setColor(Color text, Color background = BLACK)
    {
        SetConsoleTextAttribute(GetStdHandle(STD_OUTPUT_HANDLE), (background << 4) | text);
    }

    static void resetColor()
    {
        setColor(LIGHTGRAY);
    }
};

// --- Signal analysis structures ---
// Enhanced channel data structure
struct ChannelData
{
    std::vector<uint32_t> samples;
    bool changed;
    uint32_t currentState;
    int transitions;
    int totalTransitions;
    std::chrono::system_clock::time_point lastChangeTime;
    std::vector<int> sliceTransitions;       // Transitions per time slice
    std::vector<double> sliceActivityLevels; // Activity level per slice (0-100)
    double meanPhase = 0.0;        // Mean phase for quick display
    double phaseVariance = 0.0;    // Phase stability metric

    ChannelData() : changed(false), currentState(0), transitions(0), totalTransitions(0)
    {
        sliceTransitions.resize(5, 0); // Default 5 slices
        sliceActivityLevels.resize(5, 0.0);
    }
};

// Device State Structure
struct DeviceState
{
    bool connected;
    bool active;
    int consecutiveErrors;
    int capturesCount;
    int errorsCount;
    std::vector<ChannelData> channelData;
    std::map<int, std::chrono::system_clock::time_point> changedChannels;
    std::string serialNumber;                              // Added for device identification
    std::string model;                                     // Added for device info
    std::string firmwareVersion;                           // Added for device info
    std::chrono::system_clock::time_point lastCaptureTime; // Added for tracking capture times

    DeviceState() : connected(false), active(false), consecutiveErrors(0),
                    capturesCount(0), errorsCount(0),
                    serialNumber("Unknown"), model("Unknown"), firmwareVersion("Unknown")
    {
        channelData.resize(32);
    }
};

// Connection result structure - from paste-2.txt
struct ConnectionResult
{
    bool success;
    std::string message;
    double connectionTime;
    std::string errorCode;

    ConnectionResult() : success(false), connectionTime(0.0) {}
};
// Hantek device class
class HantekDevice
{
public:
    HantekDevice() : m_dll(nullptr), m_deviceIndex(0), m_sampleRate(0), m_sampleDepth(0),
                     m_serialNumber("Unknown"), m_model("Unknown"), m_firmwareVersion("Unknown") {}

    ~HantekDevice()
    {
        if (m_dll)
        {
            FreeLibrary(m_dll);
            m_dll = nullptr;
        }
    }

    bool loadDLL(const std::string &dllPath)
    {
        if (m_dll)
        {
            FreeLibrary(m_dll);
            m_dll = nullptr;
        }

        m_dll = LoadLibraryA(dllPath.c_str());

        if (!m_dll)
        {
            DWORD error = GetLastError();
            m_lastError = "Failed to load DLL: " + dllPath + " (Error code: " + std::to_string(error) + ")";
            return false;
        }

        // Load function pointers
        m_DevConnect = (DevConnectFunc)GetProcAddress(m_dll, "DevConnect");
        m_InitDevice = (InitDeviceFunc)GetProcAddress(m_dll, "InitDevice");
        m_SetCmdLA = (SetCmdLAFunc)GetProcAddress(m_dll, "SetCmdLA");
        m_SetSampleRate = (SetSampleRateFunc)GetProcAddress(m_dll, "Set_Sample_Rate");
        m_SetSampleDepth = (SetSampleDepthFunc)GetProcAddress(m_dll, "Set_SampleDepth");
        m_SetTrigEn = (SetTrigEnFunc)GetProcAddress(m_dll, "Set_Trig_En");
        m_SetTrigParameter = (SetTrigParameterFunc)GetProcAddress(m_dll, "Set_Trig_Parameter");
        m_ReadCollectStatus = (ReadCollectStatusFunc)GetProcAddress(m_dll, "ReadCollectStatus");
        m_ReadLogicData = (ReadLogicDataFunc)GetProcAddress(m_dll, "ReadLogicData");
        m_ReadSrcData = (ReadSrcDataFunc)GetProcAddress(m_dll, "ReadSrcData");
        m_SetPreTri = (SetPreTriFunc)GetProcAddress(m_dll, "Set_Pre_Tri");

        // Optional function for voltage level setting (might not be available in all DLLs)
        m_SetPWMV = (SetPWMVFunc)GetProcAddress(m_dll, "Set_PWMV");

        // Check if mandatory functions loaded successfully
        if (!m_DevConnect || !m_InitDevice || !m_SetCmdLA || !m_SetSampleRate ||
            !m_SetSampleDepth || !m_SetTrigEn || !m_SetTrigParameter ||
            !m_ReadCollectStatus || !m_ReadLogicData)
        {
            m_lastError = "Failed to load one or more required functions from DLL";
            return false;
        }

        return true;
    }

    bool connect(unsigned short deviceIndex = 0)
    {
        if (!m_DevConnect)
        {
            m_lastError = "DevConnect function not loaded";
            return false;
        }

        m_deviceIndex = deviceIndex;

        // Modified to try only once with a 1-second timeout
        auto startTime = std::chrono::steady_clock::now();
        const auto timeout = std::chrono::seconds(1);

        bool result = false;

        try
        {
            result = m_DevConnect(deviceIndex);
        }
        catch (...)
        {
            m_lastError = "Exception during DevConnect";
            return false;
        }

        if (result)
        {
            // Generate device info if connection succeeds
            generateDeviceInfo();
            return true;
        }

        // If not successful in first attempt, check if we're still within timeout
        auto elapsed = std::chrono::steady_clock::now() - startTime;
        if (elapsed < timeout)
        {
            // We have some time left, try one more time
            std::this_thread::sleep_for(std::chrono::milliseconds(200));
            try
            {
                result = m_DevConnect(deviceIndex);
            }
            catch (...)
            {
                m_lastError = "Exception during DevConnect retry";
                return false;
            }

            if (result)
            {
                // Generate device info if connection succeeds
                generateDeviceInfo();
                return true;
            }
        }

        m_lastError = "Failed to connect to device index " + std::to_string(deviceIndex) + " within timeout";
        return false;
    }

    void generateDeviceInfo()
    {
        // Generate mock device info since the real API doesn't seem to provide it
        std::vector<std::string> models = {"DSO2090", "DSO2150", "DSO2250", "DSO6022BE"};
        m_serialNumber = "HT" + std::to_string(1000 + m_deviceIndex);
        m_model = models[m_deviceIndex % models.size()];
        m_firmwareVersion = "v2.1." + std::to_string(10 + m_deviceIndex);
    }

    bool initialize()
    {
        if (!m_InitDevice)
        {
            m_lastError = "InitDevice function not loaded";
            return false;
        }

        bool result = false;

        try
        {
            result = m_InitDevice(m_deviceIndex);
        }
        catch (...)
        {
            m_lastError = "Exception during InitDevice";
            return false;
        }

        if (!result)
        {
            m_lastError = "Failed to initialize device";
            return false;
        }

        return true;
    }

    bool setSampleRate(unsigned short rateCode)
    {
        if (!m_SetSampleRate)
        {
            m_lastError = "Set_Sample_Rate function not loaded";
            return false;
        }

        short result = -1;
        try
        {
            result = m_SetSampleRate(m_deviceIndex, rateCode);
        }
        catch (...)
        {
            m_lastError = "Exception during SetSampleRate";
            return false;
        }

        if (result < 0)
        {
            m_lastError = "Failed to set sample rate (code: " + std::to_string(result) + ")";
            return false;
        }

        m_sampleRate = rateCode;
        return true;
    }

    bool setSampleDepth(unsigned long depth)
    {
        if (!m_SetSampleDepth)
        {
            m_lastError = "Set_SampleDepth function not loaded";
            return false;
        }

        short result = -1;
        try
        {
            result = m_SetSampleDepth(m_deviceIndex, depth);
        }
        catch (...)
        {
            m_lastError = "Exception during SetSampleDepth";
            return false;
        }

        if (result < 0)
        {
            m_lastError = "Failed to set sample depth (code: " + std::to_string(result) + ")";
            return false;
        }

        m_sampleDepth = depth;
        return true;
    }

    bool setVoltageThreshold(double threshold)
    {
        if (m_SetPWMV)
        {
            short result = -1;
            try
            {
                result = m_SetPWMV(m_deviceIndex, threshold, threshold);
            }
            catch (...)
            {
                m_lastError = "Exception during SetPWMV";
                return false;
            }

            if (result < 0)
            {
                m_lastError = "Failed to set voltage threshold (code: " + std::to_string(result) + ")";
                return false;
            }

            return true;
        }
        else
        {
            return true; // Optional function, not a failure if missing
        }
    }

    bool configureTrigger(bool enabled, unsigned short channel = 0, bool risingEdge = true)
    {
        if (!m_SetTrigEn || !m_SetTrigParameter)
        {
            m_lastError = "Trigger functions not loaded";
            return false;
        }

        // Enable/disable trigger
        short trigEnabled = enabled ? 1 : 0;
        short result = -1;

        try
        {
            result = m_SetTrigEn(m_deviceIndex, trigEnabled, 0);
        }
        catch (...)
        {
            m_lastError = "Exception during SetTrigEn";
            return false;
        }

        if (result < 0)
        {
            m_lastError = "Failed to enable/disable trigger (code: " + std::to_string(result) + ")";
            return false;
        }

        // If trigger is enabled, set parameters
        if (enabled)
        {
            TriggerSettings settings = {};
            settings.nEdgeSignal = channel;
            settings.nEdgeSlope = risingEdge ? 1 : 0;

            try
            {
                result = m_SetTrigParameter(m_deviceIndex, 0, (void *)&settings);
            }
            catch (...)
            {
                m_lastError = "Exception during SetTrigParameter";
                return false;
            }

            if (result < 0)
            {
                m_lastError = "Failed to set trigger parameters (code: " + std::to_string(result) + ")";
                return false;
            }
        }

        return true;
    }

    bool startCapture()
    {
        if (!m_SetCmdLA)
        {
            m_lastError = "SetCmdLA function not loaded";
            return false;
        }

        if (m_sampleRate == 0 || m_sampleDepth == 0)
        {
            m_lastError = "Sample rate or depth not set";
            return false;
        }

        bool result = false;
        try
        {
            result = m_SetCmdLA(m_deviceIndex);
        }
        catch (...)
        {
            m_lastError = "Exception during SetCmdLA";
            return false;
        }

        if (!m_SetPreTri || m_SetPreTri(m_deviceIndex, 50) < 0)
        {
            m_lastError = "Pre-trigger config failed";
            return false;
        }

        if (!result)
        {
            m_lastError = "Failed to start capture";
            return false;
        }

        return true;
    }

    bool waitForCaptureComplete(int timeoutMs = 5000)
    {
        if (!m_ReadCollectStatus)
        {
            m_lastError = "ReadCollectStatus function not loaded";
            return false;
        }

        auto startTime = std::chrono::steady_clock::now();

        while (true)
        {
            unsigned long status = 0;
            try
            {
                status = m_ReadCollectStatus(m_deviceIndex);
            }
            catch (...)
            {
                m_lastError = "Exception during ReadCollectStatus";
                return false;
            }

            if (status >= 1)
            {
                return true;
            }

            auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(
                               std::chrono::steady_clock::now() - startTime)
                               .count();

            if (elapsed > timeoutMs)
            {
                m_lastError = "Capture timeout after " + std::to_string(timeoutMs) + "ms";
                return false;
            }

            // Check every 10ms to avoid burning CPU
            std::this_thread::sleep_for(std::chrono::milliseconds(10));
        }
    }

    bool readData(std::vector<uint32_t> &data)
    {
        if (!m_ReadSrcData)
        {
            m_lastError = "ReadLogicData function not loaded";
            return false;
        }

        // Resize data buffer to match sample depth
        bool result = false;
        data.resize(m_sampleDepth);
        try
        {
            result = m_ReadSrcData(
                m_deviceIndex,
                reinterpret_cast<unsigned long *>(data.data()),
                m_sampleDepth,
                50 // Pre-trigger percentage (50%)
            );
        }
        catch (...)
        {
            m_lastError = "Exception during ReadSrcData";
            return false;
        }

        if (!result)
        {
            m_lastError = "Failed to read logic data";
            return false;
        }

        return true;
    }

    bool resetAndReconnect()
    {
        // Store current configuration before reset
        unsigned short currentRate = m_sampleRate;
        unsigned long currentDepth = m_sampleDepth;

        // Attempt to disconnect and reconnect to the device
        if (m_dll)
        {
            // Small delay before attempting reconnection
            std::this_thread::sleep_for(std::chrono::seconds(1));

            if (!connect(m_deviceIndex))
            {
                return false;
            }

            if (!initialize())
            {
                return false;
            }

            if (!setSampleRate(currentRate))
            {
                return false;
            }

            if (!setSampleDepth(currentDepth))
            {
                return false;
            }

            if (!configureTrigger(false))
            {
                return false;
            }

            return true;
        }
        return false;
    }
    bool setPreTrigger(unsigned short percentage)
    {
        if (m_SetPreTri)
        {
            short result = m_SetPreTri(m_deviceIndex, percentage);
            if (result < 0)
            {
                m_lastError = "Failed to set pre-trigger";
                return false;
            }
            return true;
        }
        return true; // Optional function
    }
    bool setupDevice(unsigned short rateCode, unsigned long depth, double threshold)
    {
        if (!setSampleRate(rateCode) ||
            !setSampleDepth(depth) ||
            !setVoltageThreshold(threshold) ||
            !configureTrigger(false)) // Disable trigger
        {
            return false;
        }
        return true;
    }

    std::string getLastError() const
    {
        return m_lastError;
    }

    unsigned long getSampleDepth() const
    {
        return m_sampleDepth;
    }

    unsigned short getDeviceIndex() const
    {
        return m_deviceIndex;
    }

    std::string getSerialNumber() const
    {
        return m_serialNumber;
    }

    std::string getModel() const
    {
        return m_model;
    }

    std::string getFirmwareVersion() const
    {
        return m_firmwareVersion;
    }

private:
    // DLL handling
    HMODULE m_dll = nullptr;
    std::vector<HMODULE> m_dlls; // Support multiple DLL instances
    unsigned short m_deviceIndex = 0;
    std::string m_lastError;

    // Sample parameters
    unsigned short m_sampleRate = 0;
    unsigned long m_sampleDepth = 0;

    // Device identification
    std::string m_serialNumber;
    std::string m_model;
    std::string m_firmwareVersion;

    // DLL function pointers
    typedef bool (*DevConnectFunc)(unsigned short);
    typedef bool (*InitDeviceFunc)(unsigned short);
    typedef bool (*SetCmdLAFunc)(unsigned short);
    typedef short (*SetSampleRateFunc)(unsigned short, unsigned short);
    typedef short (*SetSampleDepthFunc)(unsigned short, unsigned long);
    typedef short (*SetTrigEnFunc)(unsigned short, short, short);
    typedef short (*SetTrigParameterFunc)(unsigned short, unsigned short, void *);
    typedef unsigned long (*ReadCollectStatusFunc)(unsigned short);
    typedef bool (*ReadLogicDataFunc)(unsigned short, void *);
    typedef short (*SetPWMVFunc)(unsigned short, double, double);
    typedef bool (*ReadSrcDataFunc)(unsigned short, unsigned long *, unsigned long, unsigned short);
    typedef short (*SetPreTriFunc)(unsigned short, unsigned short);

    // Store function pointers
    DevConnectFunc m_DevConnect = nullptr;
    InitDeviceFunc m_InitDevice = nullptr;
    SetCmdLAFunc m_SetCmdLA = nullptr;
    SetSampleRateFunc m_SetSampleRate = nullptr;
    SetSampleDepthFunc m_SetSampleDepth = nullptr;
    SetTrigEnFunc m_SetTrigEn = nullptr;
    SetTrigParameterFunc m_SetTrigParameter = nullptr;
    ReadCollectStatusFunc m_ReadCollectStatus = nullptr;
    ReadLogicDataFunc m_ReadLogicData = nullptr;
    SetPWMVFunc m_SetPWMV = nullptr;
    ReadSrcDataFunc m_ReadSrcData = nullptr;
    SetPreTriFunc m_SetPreTri = nullptr;
};

class ThreadPool {
public:
    ThreadPool(size_t threads) : stop(false) {
        for(size_t i = 0; i < threads; ++i)
            workers.emplace_back([this] {
                for(;;) {
                    std::function<void()> task;
                    {
                        std::unique_lock<std::mutex> lock(this->queue_mutex);
                        this->condition.wait(lock, [this]{ 
                            return this->stop || !this->tasks.empty(); 
                        });
                        if(this->stop && this->tasks.empty()) return;
                        task = std::move(this->tasks.front());
                        this->tasks.pop();
                    }
                    task();
                }
            });
    }
    template<class F, class... Args>
    auto enqueue(F&& f, Args&&... args) -> std::future<decltype(f(args...))> {
        using return_type = decltype(f(args...));
        auto task = std::make_shared<std::packaged_task<return_type()>>(
            std::bind(std::forward<F>(f), std::forward<Args>(args)...)
        );
        std::future<return_type> res = task->get_future();
        {
            std::unique_lock<std::mutex> lock(queue_mutex);
            if(stop) throw std::runtime_error("enqueue on stopped ThreadPool");
            tasks.emplace([task](){ (*task)(); });
        }
        condition.notify_one();
        return res;
    }
    ~ThreadPool() {
        {
            std::unique_lock<std::mutex> lock(queue_mutex);
            stop = true;
        }
        condition.notify_all();
        for(std::thread &worker: workers)
            worker.join();
    }
private:
    std::vector<std::thread> workers;
    std::queue<std::function<void()>> tasks;
    std::mutex queue_mutex;
    std::condition_variable condition;
    bool stop;
};

// Multi-Device Logic Analyzer class
class MultiLogicAnalyzer
{
private:
    enum class DisplayMode
    {
        SUMMARY, // Show summary of all devices
        DETAILS, // Show detailed view of one device
        ACTIVITY // Show only active channels across all devices
    };
    struct DeviceGroup
    {
        std::string dllPath;
        int startIndex;
        int deviceCount;
    };

    std::vector<DeviceGroup> m_deviceGroups;
    std::vector<HantekDevice> m_devices;
    std::vector<DeviceState> m_deviceStates;
    std::vector<AnalyzerConfig> m_configs;
    std::vector<ConnectionResult> m_connectionResults;
    std::atomic<bool> m_running;
    int m_numDevices;
    int m_activeDevices;
    std::map<int, std::string> m_channelNames;
    std::chrono::system_clock::time_point m_lastConfigCheck;
    std::vector<time_t> m_lastConfigModified;
    DisplayMode m_displayMode;
    int m_detailViewDevice = 0;                              // For DETAILS mode
    std::mutex m_consoleMutex;                               // Mutex for console output
    std::mutex m_fileMutex;                                  // Mutex for file output
    std::vector<unsigned long> m_deviceSamplingRates;        // SPS for each device
    std::vector<int> m_timeSliceCounts;                      // Number of slices per device
    std::vector<double> m_timeWindows;                       // Time window (seconds) per device
    std::vector<std::pair<double, double>> m_frequencyBands; // Frequency bands (min, max) per device
    std::vector<std::pair<double, double>> FREQUENCY_BANDS = {
        {0, 100},                // Band 0: 0-100 Hz
        {500, 600},              // Band 1: 500-600 Hz
        {2000, 6000},            // Band 2: 2-6 kHz
        {10000, 50000},          // Band 3: 10-50 kHz
        {100000, 200000},        // Band 4: 100-200 kHz
        {500000, 600000},        // Band 5: 500-600 kHz
        {800000, 1200000},       // Band 6: 0.8-1.2 MHz
        {10000000, 50000000},    // Band 7: 10-50 MHz
        {100000000, 200000000},  // Band 8: 100-200 MHz
        {500000000, 600000000},  // Band 9: 500-600 MHz
        {800000000, 1200000000}, // Band 10: 0.8-1.2 GHz
        {1940000000, 5310000000} // Band 11: 1.94-5.31 GHz
    };
    std::unique_ptr<ThreadPool> m_threadPool;
    void initializeFrequencyConfigs() {
        const std::vector<std::pair<double, double>> FREQUENCY_BANDS = {
            {0, 100}, {500, 600}, {2000, 6000}, 
            {10000, 50000}, {100000, 200000}, {500000, 600000},
            {800000, 1200000}, {10000000, 50000000},
            {100000000, 200000000}, {500000000, 600000000},
            {800000000, 1200000000}, {1940000000, 5310000000}
        };
        for (int i = 0; i < m_numDevices && i < FREQUENCY_BANDS.size(); i++) {
            DeviceFrequencyConfig config;
            config.bandwidth = FREQUENCY_BANDS[i].second - FREQUENCY_BANDS[i].first;
            config.centerFreq = (FREQUENCY_BANDS[i].first + FREQUENCY_BANDS[i].second) / 2.0;
            config.samplingRate = getOptimalSamplingRate(config.centerFreq);
            config.fftSize = getOptimalFFTSize(config.samplingRate);
            m_deviceFreqConfigs.push_back(config);
        }
    }
    double getOptimalSamplingRate(double centerFreq) {
        return 2.5 * centerFreq;
    }
    int getOptimalFFTSize(double samplingRate) {
        return (int)pow(2, static_cast<int>(log2(samplingRate / 1000)));
    }
    void computeInstantaneousPhase(int deviceIndex, int channel, const std::vector<uint32_t>& samples) {
    ChannelData& chData = m_deviceStates[deviceIndex].channelData[channel];
    const int windowSize = 2048;  // Increased window size
    int N = static_cast<int>(samples.size());
    
    if (N < windowSize) {
        // Fallback: use duty cycle with enhanced calculation
        int highCount = 0;
        for (int i = 0; i < N; ++i) {
            if (((samples[i] >> channel) & 1) != 0) highCount++;
        }
        double frac = N > 0 ? static_cast<double>(highCount) / N : 0.0;
        chData.meanPhase = frac * 2 * M_PI;
        chData.phaseVariance = frac * (1.0 - frac);
        return;
    }

    // Extract last windowSize samples and convert to 0/1 values
    std::vector<double> x(windowSize);
    for (int i = 0; i < windowSize; ++i) {
        x[i] = ((samples[N - windowSize + i] >> channel) & 1) ? 1.0 : 0.0;
    }

    // Remove DC offset which can dominate the transform
    double meanOffset = std::accumulate(x.begin(), x.end(), 0.0) / windowSize;
    for (double &v : x) {
        v -= meanOffset;
    }

    // Apply Hamming window to reduce spectral leakage
    for (int i = 0; i < windowSize; ++i) {
        double w = 0.54 - 0.46 * std::cos(2 * M_PI * i / (windowSize - 1));
        x[i] *= w;
    }

    // Compute DFT
    std::vector<std::complex<double>> dft(windowSize);
    for (int k = 0; k < windowSize; ++k) {
        std::complex<double> sum(0.0, 0.0);
        for (int n = 0; n < windowSize; ++n) {
            double angle = -2 * M_PI * k * n / windowSize;
            sum += x[n] * std::complex<double>(std::cos(angle), std::sin(angle));
        }
        dft[k] = sum;
    }

    // Create analytic signal (Hilbert transform)
    // Zero negative frequencies, double positive frequencies
    int nyquist = windowSize / 2;
    for (int k = 1; k < nyquist; ++k) {
        dft[k] *= 2.0;
    }
    for (int k = nyquist + 1; k < windowSize; ++k) {
        dft[k] = 0.0;
    }

    // Inverse DFT to get analytic signal
    std::vector<std::complex<double>> analytic(windowSize);
    for (int n = 0; n < windowSize; ++n) {
        std::complex<double> sum(0.0, 0.0);
        for (int k = 0; k < windowSize; ++k) {
            double angle = 2 * M_PI * k * n / windowSize;
            sum += dft[k] * std::complex<double>(std::cos(angle), std::sin(angle));
        }
        analytic[n] = sum / static_cast<double>(windowSize);
    }

    // Compute instantaneous phase and statistics
    double sumSin = 0.0, sumCos = 0.0;
    double sumPhase = 0.0, sumSqPhase = 0.0;
    std::vector<double> phases(windowSize);
    
    for (int i = 0; i < windowSize; ++i) {
        double phase = std::arg(analytic[i]);
        phases[i] = phase;
        
        // Handle phase wrapping
        if (i > 0) {
            double diff = phases[i] - phases[i-1];
            if (diff > M_PI) phases[i] -= 2 * M_PI;
            else if (diff < -M_PI) phases[i] += 2 * M_PI;
        }
        
        sumSin += std::sin(phase);
        sumCos += std::cos(phase);
        sumPhase += phases[i];
    }

    // Compute mean and variance
    double meanPhase = std::atan2(sumSin, sumCos);
    double mean = sumPhase / windowSize;
    double variance = 0.0;
    for (int i = 0; i < windowSize; ++i) {
        double diff = phases[i] - mean;
        variance += diff * diff;
    }
    variance /= windowSize;

    // Normalize variance to 0-1 range
    chData.meanPhase = meanPhase;
    chData.phaseVariance = std::min(1.0, std::max(0.0, variance / (M_PI * M_PI)));
}
    void configureDeviceGroups()
    {
        // First group: devices 0-9 using primary DLL
        m_deviceGroups.push_back({"C:\\Program Files (x86)\\Hantek4032L\\HTLAHard.dll", 0, 10});

        // Second group: devices 10-11 using secondary DLL
        m_deviceGroups.push_back({"C:\\Program Files (x86)\\Hantek4032L\\HTLAHard.dll", 10, 2});
    }

    struct DeviceFrequencyConfig {
        double centerFreq;
        double bandwidth;
        int fftSize;
        double samplingRate;
    };
    std::vector<DeviceFrequencyConfig> m_deviceFreqConfigs;

public:
    MultiLogicAnalyzer(int numDevices = MAX_DEVICES)
        : m_running(true), m_numDevices(numDevices), m_activeDevices(0),
          m_lastConfigCheck(std::chrono::system_clock::now()), m_displayMode(DisplayMode::SUMMARY)
    {
        // Initialize devices and state
        m_devices.resize(numDevices);
        m_deviceStates.resize(numDevices);
        m_connectionResults.resize(numDevices);
        // Initialize with default values
        m_deviceSamplingRates.resize(numDevices, 100000000); // 100 MS/s default
        m_timeSliceCounts.resize(numDevices, 5);             // 5 slices default
        m_timeWindows.resize(numDevices, 0.0003);            // 300ms default
        double low = 0.5, high = 200.0;
        double step = (high - low) / 12.0;
        for (int i = 0; i < 12; i++)
        {
            m_frequencyBands.push_back({low + i * step, low + (i + 1) * step});
        }

        // Initialize channel names
        for (int i = 0; i < 32; i++)
        {
            if (i < 16)
            {
                m_channelNames[i] = "A" + std::to_string(i);
            }
            else
            {
                m_channelNames[i] = "B" + std::to_string(i - 16);
            }
        }

        // Initialize default config for each device
        for (int i = 0; i < numDevices; i++)
        {
            std::string configFile = "logic_config_" + std::to_string(i) + ".txt";
            m_configs.push_back(AnalyzerConfig());
            m_configs[i].configFilePath = configFile;
            m_configs[i].voltageThreshold = 1.7; // Set threshold to 1.7 for all devices
        }

        // Create output directories
        _mkdir("device_data"); // For individual device data

        // Create the output directory for brain-viz
        ensureDirectoryExists(OUTPUT_DIRECTORY);

        // Initialize last config modified times
        m_lastConfigModified.resize(numDevices, 0);
        // Setup default device groups (0-9 and 10-11)
        configureDeviceGroups();
        m_threadPool = std::make_unique<ThreadPool>(std::thread::hardware_concurrency());
        initializeFrequencyConfigs();
    }

    ~MultiLogicAnalyzer()
    {
        // Ensure threads are stopped before destruction
        m_running = false;
    }

    void ensureDirectoryExists(const std::string &path)
    {
        // Create each directory in the path
        std::string currentPath;
        size_t pos = 0;

        while ((pos = path.find('\\', pos + 1)) != std::string::npos)
        {
            currentPath = path.substr(0, pos);
            _mkdir(currentPath.c_str());
        }

        // Create the final directory
        _mkdir(path.c_str());
    }

    bool initialize(const std::string &dllPath)
    {
        std::cout << "=== Initializing Multi-Device Logic Analyzer ===\n";
        std::cout << "Looking for " << m_numDevices << " devices...\n\n";

       

        // Load configurations first
        for (int i = 0; i < m_numDevices; i++)
        {
            if (!loadConfiguration(i))
            {
                std::cout << "Failed to load configuration for device " << i << ", using defaults\n";
            }
        }

        // Initialize device states
        for (int i = 0; i < m_numDevices; i++)
            {
            DeviceState &state = m_deviceStates[i];
            state.connected = false;
            state.active = false;
        }

        // Load DLL only once for testing
        HantekDevice tempDevice;
        if (!tempDevice.loadDLL(dllPath))
        {
            std::cerr << "Failed to load DLL: " << tempDevice.getLastError() << "\n";
            return false;
        }

        // Try to connect to each device sequentially
        connectDevicesSequentially(dllPath);

        std::cout << "\n=== Multi-Device Logic Analyzer initialized ===\n";
        std::cout << "Successfully connected to " << m_activeDevices << " out of " << m_numDevices << " devices\n\n";

        // Always return true to continue with display even if no devices are connected
        return true;
    }
    void configureDevice(int deviceIndex, unsigned long samplingRate, int slices, double windowSec)
    {
        if (deviceIndex < m_deviceSamplingRates.size())
        {
            m_deviceSamplingRates[deviceIndex] = samplingRate;
            m_timeSliceCounts[deviceIndex] = slices;
            m_timeWindows[deviceIndex] = windowSec;
        }
    }

    void connectDevicesSequentially(const std::string &dllPath)
    {
        std::cout << "=== Starting Sequential Connection to " << m_numDevices << " Hantek Devices ===\n";
        std::cout << "Maximum retries per device: " << MAX_RETRIES << "\n";
        std::cout << "Connection timeout: " << CONNECTION_TIMEOUT_MS << "ms\n\n";

        auto overallStartTime = std::chrono::steady_clock::now();

        for (const auto& group : m_deviceGroups) {
            for (int i = 0; i < group.deviceCount; i++) {
                int deviceIndex = group.startIndex + i;
                if (deviceIndex >= m_numDevices) break;

                std::cout << "\n--- Device " << deviceIndex << " Connection Attempt ---\n";
                HantekDevice& device = m_devices[deviceIndex];

                // Load DLL for this device (each device gets its own instance)
                if (!device.loadDLL(group.dllPath)) {
                    std::cout << "  DLL load FAILED: " << device.getLastError() << "\n";
                    continue;
                }

                // Connect using deviceIndex
                if (!device.connect(deviceIndex)) {
                    std::cout << "  Connection FAILED: " << device.getLastError() << "\n";
                    continue;
                }

                // Initialize device
                if (!device.initialize()) {
                    std::cout << "  Initialization FAILED: " << device.getLastError() << "\n";
                    continue;
                }

                // Apply configuration
                if (!applyConfiguration(deviceIndex)) {
                    std::cout << "  Configuration FAILED\n";
                    continue;
                }

                // Update device state
                m_deviceStates[deviceIndex].connected = true;
                m_deviceStates[deviceIndex].active = true;
                m_deviceStates[deviceIndex].serialNumber = device.getSerialNumber();
                m_deviceStates[deviceIndex].model = device.getModel();
                m_deviceStates[deviceIndex].firmwareVersion = device.getFirmwareVersion();
                m_activeDevices++;

                // Store device info
                m_configs[deviceIndex].serialNumber = device.getSerialNumber();
                m_configs[deviceIndex].model = device.getModel();

                std::cout << "  Connection SUCCESS\n";
            }
        }
        auto overallEndTime = std::chrono::steady_clock::now();
        double totalTime = std::chrono::duration<double>(overallEndTime - overallStartTime).count();

        std::cout << "\n=== Connection Process Complete ===\n";
        std::cout << "Total time: " << std::fixed << std::setprecision(2) << totalTime << " seconds\n";
        std::cout << "Connected devices: " << m_activeDevices << "/" << m_numDevices << "\n";
    }

    void run()
    {
        std::cout << "Starting monitoring system...\n";
        std::cout << "Press 'Q' to quit, 'R' to reset statistics, 'C' to reload config\n";
        std::cout << "Press 'D' to cycle display modes (Summary/Details/Activity)\n\n";

        // Create worker threads for each active device
        std::vector<std::thread> deviceThreads;

        for (int i = 0; i < m_numDevices; i++)
        {
            if (m_deviceStates[i].connected && m_deviceStates[i].active)
            {
                deviceThreads.emplace_back(&MultiLogicAnalyzer::deviceWorker, this, i);
            }
        }

        // Also generate dummy data updates for disconnected devices
        std::thread dummyDataThread([&]()
                                    {
            while (m_running) {
                // Create/update dummy data for visualization compatibility
                exportNeuralMonitorData();
                std::this_thread::sleep_for(std::chrono::milliseconds(500));
            } });

        // Main display loop
        while (m_running)
        {
            // Display results
            displayResults();

            // Check for user input
            if (_kbhit())
            {
                char key = _getch();
                if (key == 'q' || key == 'Q')
                {
                    m_running = false;
                    std::cout << "\nStopping monitoring...\n";
                }
                else if (key == 'r' || key == 'R')
                {
                    // Reset statistics for all devices
                    for (int i = 0; i < m_numDevices; i++)
                    {
                        if (m_deviceStates[i].connected)
                        {
                            resetStatistics(i);
                        }
                    }
                    std::cout << "\nStatistics reset for all devices\n";
                }
                else if (key == 'c' || key == 'C')
                {
                    // Force reload configuration
                    m_lastConfigCheck = std::chrono::system_clock::now() - std::chrono::seconds(10);
                    std::cout << "\nForcing configuration reload...\n";
                }
                else if (key == 'd' || key == 'D')
                {
                    // Cycle display modes
                    m_displayMode = static_cast<DisplayMode>((static_cast<int>(m_displayMode) + 1) % 3);
                    std::cout << "\nSwitched to " << getDisplayModeName() << " display mode\n";
                }
            }

            // Sleep for a short period
            std::this_thread::sleep_for(std::chrono::milliseconds(200));
        }

        // Join all device threads
        for (auto &thread : deviceThreads)
        {
            if (thread.joinable())
            {
                thread.join();
            }
        }

        // Join dummy data thread
        if (dummyDataThread.joinable())
        {
            dummyDataThread.join();
        }

        std::cout << "\nMonitoring stopped.\n";
    }
    // Device worker thread
    void deviceWorker(int deviceIndex)
    {
        DeviceState &state = m_deviceStates[deviceIndex];
        HantekDevice &device = m_devices[deviceIndex];
       
        const int CHANGE_HIGHLIGHT_MS = 3000;
        while (m_running && state.active)
        {
            bool configChanged = checkConfigurationChanges(deviceIndex);
            if (configChanged)
            {
                std::this_thread::sleep_for(std::chrono::milliseconds(500));
                continue;
            }
            bool captureSuccess = false;
            try
            {
                auto captureStartTime = std::chrono::steady_clock::now();
                const auto captureTimeout = std::chrono::seconds(3);
                if (!device.startCapture())
                {
                    handleDeviceError(deviceIndex, "Failed to start capture: " + device.getLastError());
                    
                }
                else
                {
                    if (!device.waitForCaptureComplete(2000))
                    {
                        state.consecutiveErrors++;
                        handleDeviceError(deviceIndex, "Capture timeout");
                        
                    }
                    else
                    {
                        auto elapsedTime = std::chrono::steady_clock::now() - captureStartTime;
                        if (elapsedTime > captureTimeout)
                        {
                            handleDeviceError(deviceIndex, "Total capture operation timed out");
                            state.consecutiveErrors++;
                            
                        }
                        else
                        {
                            std::vector<uint32_t> capturedData;
                            if (!device.readData(capturedData))
                            {
                                handleDeviceError(deviceIndex, "Failed to read data: " + device.getLastError());
                               
                            }
                            else
                            {
                                processData(deviceIndex, capturedData);
                                captureSuccess = true;
                                state.consecutiveErrors = 0;
                                state.capturesCount++;
                                state.lastCaptureTime = std::chrono::system_clock::now();
                            }
                        }
                    }
                }
            }
            catch (const std::exception &e)
            {
                handleDeviceError(deviceIndex, std::string("Exception: ") + e.what());
                
            }
            catch (...)
            {
                handleDeviceError(deviceIndex, "Unknown exception in device worker");
                
            }
            if (!captureSuccess)
            {
                state.consecutiveErrors++;
                state.errorsCount++;
                if (state.consecutiveErrors >= 5)
                {
                    if (device.resetAndReconnect())
                    {
                        if (applyConfiguration(deviceIndex))
                        {
                            state.consecutiveErrors = 0;
                        }
                    }
                    else
                    {
                        if (state.consecutiveErrors >= 10)
                        {
                            state.active = false;
                            m_activeDevices--;
                            break;
                        }
                    }
                }
                std::this_thread::sleep_for(std::chrono::milliseconds(200));
            }
            auto now = std::chrono::system_clock::now();
            std::vector<int> channelsToRemove;
            for (const auto &entry : state.changedChannels)
            {
                int ch = entry.first;
                auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(
                                   now - state.channelData[ch].lastChangeTime)
                                   .count();
                if (elapsed > CHANGE_HIGHLIGHT_MS)
                {
                    channelsToRemove.push_back(ch);
                }
            }
            for (int ch : channelsToRemove)
            {
                state.changedChannels.erase(ch);
            }
            std::this_thread::sleep_for(std::chrono::milliseconds(m_configs[deviceIndex].scanIntervalMs));
        }
    }

    void handleDeviceError(int deviceIndex, const std::string &errorMsg)
    {
        std::lock_guard<std::mutex> lock(m_consoleMutex);
        std::cerr << "Device " << deviceIndex << " ERROR: " << errorMsg << "\n";
    }

    bool loadConfiguration(int deviceIndex)
    {
        if (deviceIndex >= m_configs.size())
        {
            return false;
        }

        const std::string &configPath = m_configs[deviceIndex].configFilePath;
        std::ifstream configFile(configPath);

        if (!configFile.is_open())
        {
            // Create default config file if it doesn't exist
            saveConfiguration(deviceIndex);
            return true;
        }

        std::string line;
        while (std::getline(configFile, line))
        {
            // Skip empty lines and comments
            if (line.empty() || line[0] == '#')
                continue;

            size_t pos = line.find('=');
            if (pos == std::string::npos)
                continue;

            std::string key = line.substr(0, pos);
            std::string value = line.substr(pos + 1);

            // Trim whitespace
            key.erase(0, key.find_first_not_of(" \t"));
            key.erase(key.find_last_not_of(" \t") + 1);
            value.erase(0, value.find_first_not_of(" \t"));
            value.erase(value.find_last_not_of(" \t") + 1);

            // Parse configuration values with error checking
            try
            {
                if (key == "sample_rate_code")
                {
                    int rate = std::stoi(value);
                    if (rate >= 0 && rate <= 12)
                    {
                        m_configs[deviceIndex].sampleRateCode = static_cast<unsigned short>(rate);
                    }
                }
                else if (key == "sample_depth")
                {
                    unsigned long depth = std::stoul(value);
                    if (depth >= 1000 && depth <= 32000000)
                    {
                        m_configs[deviceIndex].sampleDepth = depth;
                    }
                }
                else if (key == "scan_interval_ms")
                {
                    int interval = std::stoi(value);
                    if (interval >= 10 && interval <= 5000)
                    {
                        m_configs[deviceIndex].scanIntervalMs = interval;
                    }
                }
                else if (key == "voltage_threshold")
                {
                    double threshold = std::stod(value);
                    if (threshold >= 0.5 && threshold <= 5.0)
                    {
                        m_configs[deviceIndex].voltageThreshold = threshold;
                    }
                }
                else if (key == "enable_trigger")
                {
                    m_configs[deviceIndex].enableTrigger = (value == "1" || value == "true");
                }
                else if (key == "trigger_channel")
                {
                    int channel = std::stoi(value);
                    if (channel >= 0 && channel <= 31)
                    {
                        m_configs[deviceIndex].triggerChannel = static_cast<unsigned short>(channel);
                    }
                }
                else if (key == "trigger_rising_edge")
                {
                    m_configs[deviceIndex].triggerRisingEdge = (value == "1" || value == "true");
                }
                else if (key.substr(0, 8) == "channel_")
                {
                    // Parse channel name (format: channel_X=Name)
                    try
                    {
                        int ch = std::stoi(key.substr(8));
                        if (ch >= 0 && ch < 32)
                        {
                            m_channelNames[ch] = value;
                        }
                    }
                    catch (...)
                    {
                        // Ignore invalid channel indices
                    }
                }
            }
            catch (const std::exception &e)
            {
                // Just skip invalid values
            }
        }

        configFile.close();

        // Store last modified time
        struct stat configStat;
        if (stat(configPath.c_str(), &configStat) == 0)
        {
            if (deviceIndex >= m_lastConfigModified.size())
            {
                m_lastConfigModified.resize(deviceIndex + 1, 0);
            }
            m_lastConfigModified[deviceIndex] = configStat.st_mtime;
        }

        return true;
    }

    void saveConfiguration(int deviceIndex)
    {
        if (deviceIndex >= m_configs.size())
        {
            return;
        }

        std::ofstream configFile(m_configs[deviceIndex].configFilePath);
        if (!configFile.is_open())
            return;

        configFile << "# Logic Analyzer Configuration File for Device " << deviceIndex << "\n";
        configFile << "# Sample rate codes: 0=1MHz, 1=2MHz, 2=5MHz, 3=10MHz, 4=20MHz, 5=25MHz, 6=50MHz, 7=80MHz, 8=100MHz\n";
        configFile << "sample_rate_code=" << m_configs[deviceIndex].sampleRateCode << "\n";
        configFile << "sample_depth=" << m_configs[deviceIndex].sampleDepth << "\n";
        configFile << "scan_interval_ms=" << m_configs[deviceIndex].scanIntervalMs << "\n";
        configFile << "voltage_threshold=" << m_configs[deviceIndex].voltageThreshold << "\n";
        configFile << "enable_trigger=" << (m_configs[deviceIndex].enableTrigger ? "1" : "0") << "\n";
        configFile << "trigger_channel=" << m_configs[deviceIndex].triggerChannel << "\n";
        configFile << "trigger_rising_edge=" << (m_configs[deviceIndex].triggerRisingEdge ? "1" : "0") << "\n";

        // Save channel names
        for (int i = 0; i < 32; i++)
        {
            configFile << "channel_" << i << "=" << m_channelNames[i] << "\n";
        }

        configFile.close();

        // Update last modified time
        struct stat configStat;
        if (stat(m_configs[deviceIndex].configFilePath.c_str(), &configStat) == 0)
        {
            if (deviceIndex >= m_lastConfigModified.size())
            {
                m_lastConfigModified.resize(deviceIndex + 1, 0);
            }
            m_lastConfigModified[deviceIndex] = configStat.st_mtime;
        }
    }

    bool applyConfiguration(int deviceIndex)
    {
        if (deviceIndex >= m_devices.size() || deviceIndex >= m_configs.size())
        {
            return false;
        }

        HantekDevice &device = m_devices[deviceIndex];
        const AnalyzerConfig &config = m_configs[deviceIndex];
        m_deviceSamplingRates[deviceIndex] = getSamplingRateFromCode(config.sampleRateCode);

        // Set sample rate
        if (!device.setSampleRate(config.sampleRateCode))
        {
            return false;
        }

        // Set sample depth
        if (!device.setSampleDepth(config.sampleDepth))
        {
            return false;
        }

        // Set voltage threshold (always use 1.7)
        device.setVoltageThreshold(1.7);

        // Configure trigger
        if (!device.configureTrigger(config.enableTrigger, config.triggerChannel, config.triggerRisingEdge))
        {
            return false;
        }

        return true;
    }
    unsigned long getSamplingRateFromCode(unsigned short code)
    {
        switch (code)
        {
        case 0:
            return 1000000; // 1 MS/s
        case 1:
            return 2000000; // 2 MS/s
        case 2:
            return 5000000; // 5 MS/s
        // ... add cases 3-12 as per your device specs
        default:
            return 100000000; // Default 100 MS/s
        }
    }

    bool checkConfigurationChanges(int deviceIndex)
    {
        if (deviceIndex >= m_configs.size() || deviceIndex >= m_lastConfigModified.size())
        {
            return false;
        }

        // Check every 3 seconds
        auto now = std::chrono::system_clock::now();
        auto elapsed = std::chrono::duration_cast<std::chrono::seconds>(now - m_lastConfigCheck).count();

        if (elapsed < 3)
            return false;

        // Only reset the check timer if this is device 0 (to avoid multiple resets)
        if (deviceIndex == 0)
        {
            m_lastConfigCheck = now;
        }

        const std::string &configPath = m_configs[deviceIndex].configFilePath;

        // Check if config file was modified
        struct stat configStat;
        if (stat(configPath.c_str(), &configStat) != 0)
            return false;

        if (configStat.st_mtime <= m_lastConfigModified[deviceIndex])
            return false;

        m_lastConfigModified[deviceIndex] = configStat.st_mtime;

        // Store the old configuration for comparison
        AnalyzerConfig oldConfig = m_configs[deviceIndex];

        // Reload configuration
        if (!loadConfiguration(deviceIndex))
        {
            return false;
        }

        // Check what changed and if device needs reconfiguration
        bool deviceNeedsReconfiguration = false;

        if (oldConfig.sampleRateCode != m_configs[deviceIndex].sampleRateCode ||
            oldConfig.sampleDepth != m_configs[deviceIndex].sampleDepth ||
            oldConfig.voltageThreshold != m_configs[deviceIndex].voltageThreshold ||
            oldConfig.enableTrigger != m_configs[deviceIndex].enableTrigger ||
            oldConfig.triggerChannel != m_configs[deviceIndex].triggerChannel ||
            oldConfig.triggerRisingEdge != m_configs[deviceIndex].triggerRisingEdge)
        {
            deviceNeedsReconfiguration = true;
        }

        // Apply device changes if needed
        if (deviceNeedsReconfiguration)
        {
            if (!applyConfiguration(deviceIndex))
            {
                // Revert to old config on failure
                m_configs[deviceIndex] = oldConfig;
                applyConfiguration(deviceIndex);
                return false;
            }
        }

        return deviceNeedsReconfiguration;
    }

    void processData(int deviceIndex, const std::vector<uint32_t> &capturedData)
    {
      
        DeviceState &state = m_deviceStates[deviceIndex];
        const unsigned long samplingRate = m_deviceSamplingRates[deviceIndex];
        const int numSlices = m_timeSliceCounts[deviceIndex];
        const double timeWindow = m_timeWindows[deviceIndex];

        // Calculate samples per slice
        const size_t totalSamples = capturedData.size();
        const size_t samplesPerSlice = totalSamples / numSlices;

        // Get current time for change timestamp
        auto now = std::chrono::system_clock::now();

        // Process each channel
        for (int ch = 0; ch < 32; ch++)
        {
            // Initialize channel data if first time
            if (state.channelData[ch].samples.empty())
            {
                state.channelData[ch].samples = capturedData;
                state.channelData[ch].currentState = (capturedData[0] >> ch) & 1;
                state.channelData[ch].transitions = 0;
                state.channelData[ch].totalTransitions = 0;
                state.channelData[ch].changed = false;
                continue;
            }
            state.channelData[ch].sliceTransitions.assign(numSlices, 0);

            // Extract channel bit from each sample
            int transitions = 0;
            uint32_t lastState = (capturedData[0] >> ch) & 1;

            // Count transitions (changes in state)
            for (size_t i = 1; i < totalSamples; i++)
            {
                uint32_t currentState = (capturedData[i] >> ch) & 1;
                if (currentState != lastState)
                {
                    transitions++;
                    lastState = currentState;
                }
            }
            // Process each time slice
            for (int slice = 0; slice < numSlices; slice++)
            {
                size_t start = slice * samplesPerSlice;
                size_t end = (slice == numSlices - 1) ? totalSamples : (slice + 1) * samplesPerSlice;

                uint32_t lastState = (capturedData[start] >> ch) & 1;
                int sliceTransitions = 0;

                for (size_t i = start + 1; i < end; i++)
                {
                    uint32_t currentState = (capturedData[i] >> ch) & 1;
                    if (currentState != lastState)
                    {
                        sliceTransitions++;
                        lastState = currentState;
                    }
                }

                state.channelData[ch].sliceTransitions[slice] = sliceTransitions;

                // Calculate activity level (normalized 0-100)
                double maxPossible = (end - start) * samplingRate * timeWindow;
                state.channelData[ch].sliceActivityLevels[slice] =
                    std::min<double>(100.0, (sliceTransitions / maxPossible) * 1000.0);
            }

        
            // Store current state
            state.channelData[ch].currentState = lastState;
            state.channelData[ch].transitions = transitions;
            state.channelData[ch].totalTransitions += transitions;

            // Check if channel has changed since last capture
            bool hasChanged = false;

            // Compare transitions count - if there are any new transitions, mark as changed
            if (transitions > 0)
            {
                hasChanged = true;
            }

            // If channel has changed
            if (hasChanged)
            {
                state.channelData[ch].changed = true;
                state.channelData[ch].lastChangeTime = now;
                state.changedChannels[ch] = now;
            }
            else
            {
                state.channelData[ch].changed = false;
            }

            // Store raw sample data
            state.channelData[ch].samples = capturedData;
        }
        
        // Phase analysis for first 12 channels
        std::vector<std::future<void>> futures;
        for (int ch = 0; ch < 12; ch++) {
            futures.emplace_back(
                m_threadPool->enqueue([this, deviceIndex, ch, &capturedData]{
                    computeInstantaneousPhase(deviceIndex, ch, capturedData);
                })
            );
        }
        for(auto &future : futures) {
            future.wait();
        }
        // Export phase data to TXT for Next.js and processing
        exportPhaseDataTXT();
        // Export data to file for this device
        exportDeviceData(deviceIndex);
    }
    
    
   
    
    void exportTimeSlicedData()
    {
        std::lock_guard<std::mutex> lock(m_fileMutex);

        std::string outputPath = OUTPUT_DIRECTORY + "\\time_sliced_data.txt";
        std::ofstream outFile(outputPath);

        if (!outFile.is_open())
        {
            std::cerr << "Failed to open time-sliced output file: " << outputPath << std::endl;
            return;
        }

        // Header
        outFile << "# Time-sliced neural activity data\n";
        outFile << "# Format:device_id,channel_id,slice0_activity,slice1_activity,slice2_activity,slice3_activity,slice4_activity\n";

        for (int deviceIndex = 0; deviceIndex < m_deviceStates.size(); deviceIndex++)
        {
            const DeviceState &state = m_deviceStates[deviceIndex];
            if (!state.connected)
                continue;

            // Only process first 12 channels (brain probes)
            for (int ch = 0; ch < 12; ch++)
            {
                const ChannelData &chData = state.channelData[ch];
                outFile << deviceIndex << "," << ch;

                // Slice activity levels
                for (size_t i = 0; i < chData.sliceActivityLevels.size(); i++)
                {
                    outFile << "," << std::fixed << std::setprecision(1) << chData.sliceActivityLevels[i];
                }
                outFile << "\n";
            }
        }

        outFile.close();
    }
    // Export device data to a file for neural visualization
    void exportDeviceData(int deviceIndex)
    {
        if (deviceIndex >= m_deviceStates.size())
        {
            return;
        }

        const DeviceState &state = m_deviceStates[deviceIndex];

        if (!state.connected || !state.active)
        {
            return;
        }

        // Create a combined output for neural visualization
        exportNeuralMonitorData();
        exportTimeSlicedData();
        
    }
    // Export consolidated neural monitor data for all devices
    void exportNeuralMonitorData()
    {
        std::lock_guard<std::mutex> lock(m_fileMutex);

        std::string outputPath = OUTPUT_DIRECTORY + "\\" + OUTPUT_FILENAME;
        std::ofstream outputFile(outputPath);

        if (!outputFile.is_open())
        {
            std::cerr << "Failed to open output file: " << outputPath << std::endl;
            return;
        }

        // Get current timestamp
        auto now = std::chrono::system_clock::now();
        std::time_t now_c = std::chrono::system_clock::to_time_t(now);
        struct tm *timeinfo = std::localtime(&now_c);
        char timestamp[100];
        std::strftime(timestamp, sizeof(timestamp), "%Y-%m-%d %H:%M:%S", timeinfo);

        // Write header
        outputFile << "# Neural Monitor Data - Updated: " << timestamp << "\n";
        outputFile << "# Format: [device_id],[serial],[model],[channel_id],[state],[transitions],[active]\n\n";

        // Write data for all devices
        for (int deviceIndex = 0; deviceIndex < m_deviceStates.size(); deviceIndex++)
        {
            const DeviceState &state = m_deviceStates[deviceIndex];

            // Skip disconnected devices
            if (!state.connected)
            {
                continue;
            }

            // Write device header
            outputFile << "DEVICE," << deviceIndex << "," << state.serialNumber << ","
                       << state.model << "," << state.capturesCount << "\n";

            // Write channel data
            for (int ch = 0; ch < 32; ch++)
            {
                // Only include channels that have shown some activity
                if (state.channelData[ch].totalTransitions > 0)
                {
                    // Calculate activity level based on recent changes (0-100)
                    int activityLevel = 0;

                    if (state.changedChannels.find(ch) != state.changedChannels.end())
                    {
                        auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(
                                           now - state.channelData[ch].lastChangeTime)
                                           .count();

                        // More recent changes get higher activity levels
                        if (elapsed < 500)
                        {
                            activityLevel = 100;
                        }
                        else if (elapsed < 1000)
                        {
                            activityLevel = 75;
                        }
                        else if (elapsed < 2000)
                        {
                            activityLevel = 50;
                        }
                        else
                        {
                            activityLevel = 25;
                        }
                    }

                    // Format: channel_id, name, current_state, transitions, total_transitions, activity_level
                    outputFile << "CHANNEL," << ch << "," << m_channelNames[ch] << ","
                               << state.channelData[ch].currentState << ","
                               << state.channelData[ch].transitions << ","
                               << state.channelData[ch].totalTransitions << ","
                               << activityLevel << "\n";
                }
            }

            // --- Export phase data for first 12 channels ---
            for (int ch = 0; ch < 12; ch++) {
                const ChannelData& chData = state.channelData[ch];
                outputFile << "PHASE_DATA," << deviceIndex << "," << ch << ","
                           << chData.meanPhase << "," << chData.phaseVariance << "\n";
            }
            // Add a blank line between devices
            outputFile << "\n";
        }

        outputFile.close();
    }

    void resetStatistics(int deviceIndex)
    {
        if (deviceIndex < 0 || deviceIndex >= m_deviceStates.size())
            return;

        DeviceState &state = m_deviceStates[deviceIndex];
        state.capturesCount = 0;
        state.errorsCount = 0;
        state.consecutiveErrors = 0;

        // Reset channel statistics
        for (int ch = 0; ch < 32; ch++)
        {
            state.channelData[ch].totalTransitions = 0;
            state.channelData[ch].transitions = 0;
        }

        // Clear changed channels
        state.changedChannels.clear();
    }

    std::string getDisplayModeName() const
    {
        switch (m_displayMode)
        {
        case DisplayMode::SUMMARY:
            return "Summary";
        case DisplayMode::DETAILS:
            return "Details";
        case DisplayMode::ACTIVITY:
            return "Activity";
        default:
            return "Unknown";
        }
    }

    void displayResults()
    {
        // Clear screen
        system("cls");

        // Display header
        std::cout << "======== HANTEK MULTI-DEVICE NEURAL ANALYZER ========\n";
        std::cout << "Active Devices: " << m_activeDevices << "/" << m_numDevices << " | ";
        std::cout << "Display Mode: " << getDisplayModeName() << "\n";
        std::cout << "Press 'Q' to quit, 'R' to reset statistics, 'C' to reload config, 'D' to change display mode\n\n";

        // Current timestamp
        auto now = std::chrono::system_clock::now();
        std::time_t now_c = std::chrono::system_clock::to_time_t(now);
        std::cout << "Last update: " << std::ctime(&now_c);

        // Display according to mode
        switch (m_displayMode)
        {
        case DisplayMode::SUMMARY:
            displaySummaryView();
            break;
        case DisplayMode::DETAILS:
            displayDetailView();
            break;
        case DisplayMode::ACTIVITY:
            displayActivityView();
            break;
        }
    }

    void displaySummaryView()
    {
        // Show summary of all devices
        std::cout << "Device | Status   | Serial   | Model    | Active Channels\n";
        std::cout << "-------+----------+----------+----------+----------------\n";
        for (int i = 0; i < m_numDevices; i++)
        {
            const DeviceState &state = m_deviceStates[i];
            if (!state.connected)
            {
                ConsoleColors::setColor(ConsoleColors::DARKGRAY);
                std::cout << std::setw(6) << i << " | ";
                std::cout << "NOT FOUND | ";
                std::cout << std::setw(8) << "-" << " | ";
                std::cout << std::setw(8) << "-" << " | ";
                std::cout << "-" << std::endl;
                ConsoleColors::resetColor();
                continue;
            }
            int activeChannels = 0;
            int changingChannels = 0;
            for (int ch = 0; ch < 32; ch++)
            {
                if (state.channelData[ch].totalTransitions > 0)
                {
                    activeChannels++;
                    if (state.changedChannels.find(ch) != state.changedChannels.end())
                    {
                        changingChannels++;
                    }
                }
            }
            if (!state.active)
            {
                ConsoleColors::setColor(ConsoleColors::RED);
            }
            else if (state.consecutiveErrors > 0)
            {
                ConsoleColors::setColor(ConsoleColors::YELLOW);
            }
            else if (changingChannels > 0)
            {
                ConsoleColors::setColor(ConsoleColors::LIGHTGREEN);
            }
            else
            {
                ConsoleColors::setColor(ConsoleColors::LIGHTGRAY);
            }
            std::cout << std::setw(6) << i << " | ";
            if (!state.active)
            {
                std::cout << "ERROR     | ";
            }
            else if (state.consecutiveErrors > 0)
            {
                std::cout << "WARNING   | ";
            }
            else
            {
                std::cout << "OK        | ";
            }
            std::cout << std::setw(8) << state.serialNumber.substr(0, 8) << " | ";
            std::cout << std::setw(8) << state.model.substr(0, 8) << " | ";
            if (activeChannels > 0)
            {
                std::cout << activeChannels << " (" << changingChannels << " changing)";
            }
            else
            {
                std::cout << "None";
            }
            std::cout << std::endl;
            ConsoleColors::resetColor();
        }
    }

    void displayDetailView()
    {
        // Find first active device if current selection is invalid
        if (m_detailViewDevice >= m_deviceStates.size() ||
            !m_deviceStates[m_detailViewDevice].connected ||
            !m_deviceStates[m_detailViewDevice].active)
        {
            bool foundActive = false;
            for (int i = 0; i < m_numDevices; i++)
            {
                if (i < m_deviceStates.size() && m_deviceStates[i].connected && m_deviceStates[i].active)
                {
                    m_detailViewDevice = i;
                    foundActive = true;
                    break;
                }
            }

            if (!foundActive)
            {
                std::cout << "No active devices found.\n";
                return;
            }
        }

        const DeviceState &state = m_deviceStates[m_detailViewDevice];
        auto now = std::chrono::system_clock::now();

        // Display device info
        std::cout << "=== Device " << m_detailViewDevice << " Details ===\n";
        std::cout << "Serial: " << state.serialNumber << " | Model: " << state.model;
        std::cout << " | Firmware: " << state.firmwareVersion << "\n";
        std::cout << "Captures: " << state.capturesCount << " | Errors: " << state.errorsCount;
        if (state.consecutiveErrors > 0)
        {
            std::cout << " | Consecutive Errors: " << state.consecutiveErrors;
        }
        std::cout << "\n";

        if (m_detailViewDevice < m_configs.size())
        {
            const AnalyzerConfig &config = m_configs[m_detailViewDevice];
            std::cout << "Config: Rate=" << config.sampleRateCode << ", Depth=" << config.sampleDepth
                      << ", Interval=" << config.scanIntervalMs << "ms";
            if (config.enableTrigger)
            {
                std::cout << ", Trigger=CH" << config.triggerChannel << "(" << (config.triggerRisingEdge ? "↑" : "↓") << ")";
            }
        }
        std::cout << "\n\n";

        // Display active channels
        std::cout << "Channel | State | Current | Total     | Last Change\n";
        std::cout << "        |       | Changes | Changes   | Ago (ms)\n";
        std::cout << "--------+-------+---------+-----------+------------\n";

        bool anyActive = false;

        // First, display channels that have changed recently
        for (int ch = 0; ch < 32; ch++)
        {
            // Skip inactive channels
            if (state.channelData[ch].totalTransitions == 0 && !state.channelData[ch].changed)
                continue;

            anyActive = true;
            bool isCurrentlyChanged = state.changedChannels.find(ch) != state.changedChannels.end();

            if (isCurrentlyChanged)
            {
                // Calculate time since last change
                auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(
                                   now - state.channelData[ch].lastChangeTime)
                                   .count();

                // Set color based on recency
                if (elapsed < 500)
                {
                    ConsoleColors::setColor(ConsoleColors::YELLOW, ConsoleColors::RED);
                }
                else
                {
                    ConsoleColors::setColor(ConsoleColors::YELLOW);
                }

                // Display channel info
                std::cout << std::left << std::setw(6) << m_channelNames[ch] << " | ";
                std::cout << (state.channelData[ch].currentState ? "HIGH " : "LOW  ") << " | ";
                std::cout << std::right << std::setw(7) << state.channelData[ch].transitions << " | ";
                std::cout << std::setw(9) << state.channelData[ch].totalTransitions << " | ";
                std::cout << std::setw(8) << elapsed << " ms *\n";


                // --- Display phase info for first 12 channels ---
                if (ch < 12) {
                    const ChannelData& chData = state.channelData[ch];
                    std::cout << "    Phase: " << std::fixed << std::setprecision(2)
                              << chData.meanPhase << " rad ("
                              << chData.phaseVariance * 100 << "% var)\n";
                }
                ConsoleColors::resetColor();
            }
        }

        // Then display other active channels
        for (int ch = 0; ch < 32; ch++)
        {
            // Skip inactive channels
            if (state.channelData[ch].totalTransitions == 0)
                continue;

            bool isCurrentlyChanged = state.changedChannels.find(ch) != state.changedChannels.end();

            // Skip already displayed channels
            if (isCurrentlyChanged)
                continue;

            anyActive = true;

            // Display in regular color
            std::cout << std::left << std::setw(6) << m_channelNames[ch] << " | ";
            std::cout << (state.channelData[ch].currentState ? "HIGH " : "LOW  ") << " | ";
            std::cout << std::right << std::setw(7) << state.channelData[ch].transitions << " | ";
            std::cout << std::setw(9) << state.channelData[ch].totalTransitions << " | ";
            std::cout << std::setw(8) << "-" << std::endl;
            // --- Display phase info for first 12 channels ---
            if (ch < 12) {
                const ChannelData& chData = state.channelData[ch];
                std::cout << "    Phase: " << std::fixed << std::setprecision(2)
                          << chData.meanPhase << " rad ("
                          << chData.phaseVariance * 100 << "% var)\n";
            }
        }
        if (!anyActive)
        {
            std::cout << "No channel activity detected on device " << m_detailViewDevice << ".\n";
        }
        else
        {
            std::cout << "\n* Channels marked with an asterisk have changed recently\n";
            std::cout << "  " << state.changedChannels.size() << " channel(s) changing now\n";
        }
    }

    void displayActivityView()
    {
        // Implementation of activity view
        std::cout << "Activity view shows only active channels across all devices.\n\n";

        std::cout << "Device | Channel | State | Total Changes | Last Change\n";
        std::cout << "-------+---------+-------+--------------+------------\n";

        bool anyActive = false;

        // First show channels that are currently changing
        for (int i = 0; i < m_numDevices && i < m_deviceStates.size(); i++)
        {
            if (!m_deviceStates[i].connected || !m_deviceStates[i].active)
                continue;

            const DeviceState &state = m_deviceStates[i];
            auto now = std::chrono::system_clock::now();

            for (const auto &entry : state.changedChannels)
            {
                int ch = entry.first;
                if (ch >= 0 && ch < state.channelData.size())
                {
                    anyActive = true;

                    // Calculate time since last change
                    auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(
                                       now - state.channelData[ch].lastChangeTime)
                                       .count();

                    // Set color based on recency
                    if (elapsed < 500)
                    {
                        ConsoleColors::setColor(ConsoleColors::YELLOW, ConsoleColors::RED);
                    }
                    else
                    {
                        ConsoleColors::setColor(ConsoleColors::YELLOW);
                    }

                    // Display channel info
                    std::cout << std::setw(6) << i << " | ";
                    std::cout << std::left << std::setw(7) << m_channelNames[ch] << " | ";
                    std::cout << (state.channelData[ch].currentState ? "HIGH " : "LOW  ") << " | ";
                    std::cout << std::right << std::setw(12) << state.channelData[ch].totalTransitions << " | ";
                    std::cout << std::setw(8) << elapsed << " ms *\n";

                    ConsoleColors::resetColor();
                }
            }
        }

        if (!anyActive)
        {
            std::cout << "No channel activity detected on any device.\n";
        }
    }

    // Add a function to export phase data to TXT in logic_data.txt style
    void exportPhaseDataTXT() {
        std::string outputPath = OUTPUT_DIRECTORY + "\\phase_data.txt";
        std::ofstream outputFile(outputPath);
        if (!outputFile.is_open()) {
            std::cerr << "Failed to open phase data TXT: " << outputPath << std::endl;
            return;
        }

        // Get current timestamp
        auto now = std::chrono::system_clock::now();
        std::time_t now_c = std::chrono::system_clock::to_time_t(now);
        struct tm *timeinfo = std::localtime(&now_c);
        char timestamp[100];
        std::strftime(timestamp, sizeof(timestamp), "%Y-%m-%d %H:%M:%S", timeinfo);

        // Write header
        outputFile << "# Phase Data - Updated: " << timestamp << "\n";
        outputFile << "# Format: [device_id],[serial],[model],[channel_id],[meanPhase],[phaseVariance]\n\n";

        // Write data for all devices
        for (int deviceIndex = 0; deviceIndex < m_deviceStates.size(); deviceIndex++) {
            const DeviceState &state = m_deviceStates[deviceIndex];
            if (!state.connected) {
                continue;
            }

            // Write device header
            outputFile << "DEVICE," << deviceIndex << "," << state.serialNumber << ", "
                       << state.model << "," << state.capturesCount << "\n";

            // Write phase data for first 12 channels
            for (int ch = 0; ch < 12; ch++) {
                const ChannelData& chData = state.channelData[ch];
                outputFile << "PHASE," << ch << "," << m_channelNames[ch] << ", "
                           << chData.meanPhase << "," << chData.phaseVariance << "\n";
            }
            // Add a blank line between devices
            outputFile << "\n";
        }

        outputFile.close();
    }
};
// Main function
int main(int argc, char *argv[])
{
    int exitCode = 0;
    try
    {
        // Default number of devices to scan (can be overridden by command line)
        int numDevices = MAX_DEVICES;

        // Path to Hantek DLL file (standard path for Hantek software)
        std::string dllPath = "C:\\Program Files (x86)\\Hantek4032L\\HTLAHard.dll";

        // Check command line arguments for device count
        if (argc > 1)
        {
            try
            {
                numDevices = std::stoi(argv[1]);
                if (numDevices < 1 || numDevices > MAX_DEVICES)
                {
                    std::cout << "Invalid device count (must be 1-" << MAX_DEVICES << "). Using default: " << MAX_DEVICES << "\n";
                    numDevices = MAX_DEVICES;
                }
            }
            catch (...)
            {
                std::cout << "Invalid device count. Using default: " << MAX_DEVICES << "\n";
            }
        }

        // Check command line arguments for DLL path
        if (argc > 2)
        {
            dllPath = argv[2];
        }

        std::cout << "Initializing with " << numDevices << " devices and DLL: " << dllPath << std::endl;

        // Create the analyzer with specified number of devices
        MultiLogicAnalyzer analyzer(numDevices);

        // Initialize and run if successful
        if (analyzer.initialize(dllPath))
        {
            analyzer.run();
        }
        else
        {
            std::cerr << "Failed to initialize MultiLogicAnalyzer. Exiting.\n";
            std::cout << "Press any key to exit..." << std::endl;
            _getch();
            exitCode = 1;
        }
    }
    catch (const std::exception &e)
    {
        std::cerr << "Exception in main: " << e.what() << std::endl;
        std::cout << "Press any key to exit..." << std::endl;
        _getch();
        exitCode = 1;
    }
    catch (...)
    {
        std::cerr << "Unknown exception in main" << std::endl;
        std::cout << "Press any key to exit..." << std::endl;
        _getch();
        exitCode = 1;
    }

    // Ensure all resources are released before exiting
    // Flush all file streams (if any global ones exist)
    std::cout << "Cleaning up resources..." << std::endl;
    // No global file streams, but if you add any, flush and close here

    // Wait for a moment to ensure OS releases file handles
    std::this_thread::sleep_for(std::chrono::milliseconds(100));

    std::cout << "Program finished. Press any key to exit..." << std::endl;
    _getch();
    return exitCode;
}