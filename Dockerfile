FROM scratch
ADD package/go-baseplate /
USER 1001
ENTRYPOINT ["/go-baseplate"]
CMD ["-p", "8443", "-n", "0.0.0.0"]
EXPOSE 8443
